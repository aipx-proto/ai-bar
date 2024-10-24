import type { AIBar, LlmProvider } from "./ai-bar";
import { emit } from "./events";

export interface OpenAIChatPayload {
  messages: ChatMessage[];
  temperature: number;
  top_p: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
  stop: string | string[];
  response_format?: ChatCompletionResponseFormat;
  seed?: number;
}

export interface ChatMessage {
  role: "assistant" | "user" | "system";
  content: ChatMessagePart[] | string;
}

export type ChatMessagePart = ChatMessageTextPart | ChatMessageImagePart;

export interface ChatMessageImagePart {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
}

export interface ChatMessageTextPart {
  type: "text";
  text: string;
}

export interface ChatCompletionResponseFormat {
  type: "json_object" | "text";
}

export type OpenAIChatResponse = {
  choices: {
    finish_reason: "stop" | "length" | "content_filter" | null;
    index: number;
    message: {
      content?: string; // blank when content_filter is active
      role: "assistant";
    };
  }[];
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
};

export interface ChatStreamItem {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    delta?: {
      content?: string;
    };
    index: number;
    finish_reason: "stop" | "length" | "content_filter" | null;
  }[];
  usage: null;
}

export class LlmNode extends HTMLElement implements LlmProvider {
  private messages: ChatMessage[] = [];
  private abortControllers = new Set<AbortController>();

  connectedCallback() {
    this.setAttribute("provides", "llm");
  }

  public async clear() {
    this.messages = [];
  }
  public async submit(text: string) {
    this.messages.push({ role: "user", content: [{ type: "text", text }] });

    const ac = new AbortController();
    this.abortControllers.add(ac);
    const response = this.getChatStream(this.messages, undefined, ac.signal);
    const segmenter = this.createSentenceSegmenter();

    segmenter.sentenceEmitter.addEventListener("sentence", (event) => {
      const sentence = (event as CustomEvent<string>).detail;
      emit(this, { sentenceGenerated: sentence });
    });

    for await (const item of response) {
      // create an assistant message if none exists
      let lastMessage = this.messages.at(-1);
      if (lastMessage?.role !== "assistant") {
        lastMessage = { role: "assistant", content: "" };
        this.messages.push(lastMessage);
      }

      const delta = item.choices.at(0)?.delta?.content ?? "";
      if (!delta) continue;

      lastMessage.content += delta;
      segmenter.enqueue(delta);
    }

    segmenter.flush();
  }

  private async *getChatStream(messages: ChatMessage[], config?: Partial<OpenAIChatPayload>, abortSignal?: AbortSignal): AsyncGenerator<ChatStreamItem> {
    const credentials = this.closest<AIBar>("ai-bar")?.getAzureOpenAICredentials();
    if (!credentials) throw new Error("Unable to get credentials from the closest <ai-bar>. Did you forget to provide them?");

    const payload = {
      messages,
      temperature: 0.25,
      ...config,
    };

    const stream = await fetch(`${credentials.endpoint}/openai/deployments/${credentials.deploymentName}/chat/completions?api-version=2024-10-01-preview`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "api-key": credentials.key,
      },
      body: JSON.stringify({ ...payload, stream: true }),
      signal: abortSignal,
    }).catch((e) => {
      console.error(e);
      throw e;
    });

    if (!stream.ok) {
      throw new Error(`Request failed: ${[stream.status, stream.statusText, await stream.text()].join(" ")}`);
    }

    if (!stream.body) throw new Error("Request failed");

    const reader = stream.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let unfinishedLine = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      // Massage and parse the chunk of data
      const chunk = decoder.decode(value);

      // because the packets can split anywhere, we only process whole lines
      const currentWindow = unfinishedLine + chunk;
      unfinishedLine = currentWindow.slice(currentWindow.lastIndexOf("\n") + 1);

      const wholeLines = currentWindow
        .slice(0, currentWindow.lastIndexOf("\n") + 1)
        .split("\n")
        .filter(Boolean);

      const matches = wholeLines.map((wholeLine) => [...wholeLine.matchAll(/^data: (\{.*\})$/g)][0]?.[1]).filter(Boolean);

      for (const match of matches) {
        const item = JSON.parse(match);
        if ((item as any)?.error?.message) throw new Error((item as any).error.message);
        if (!Array.isArray(item?.choices)) throw new Error("Invalid response");
        yield item;
      }
    }
  }

  private createSentenceSegmenter() {
    const sentenceEmitter = new EventTarget();

    let buffer = "";

    const enqueue = (text: string) => {
      const sentences = this.splitBySentence(buffer + text);
      // the last sentence is incomplete. only emit the first n-1 sentences

      const completeSpeech = sentences.slice(0, -1).join("");
      if (completeSpeech.trim()) {
        sentenceEmitter.dispatchEvent(new CustomEvent("sentence", { detail: completeSpeech }));
      }

      buffer = sentences.at(-1) ?? "";
    };

    function flush() {
      if (buffer.trim()) {
        sentenceEmitter.dispatchEvent(new CustomEvent("sentence", { detail: buffer }));
        buffer = "";
      }
    }

    return {
      sentenceEmitter,
      flush,
      enqueue,
    };
  }

  private splitBySentence(input: string): string[] {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "sentence" });
    const iterator = segmenter.segment(input);
    const items = [...iterator].map((item) => item.segment);
    return items;
  }
}

export function defineLlmNode(tagName = "llm-node") {
  customElements.define(tagName, LlmNode);
}

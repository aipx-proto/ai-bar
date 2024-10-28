import { attachShadowHtml } from "../wc-utils/attach-html";
import type { AIBarEventDetail } from "./events";

export interface SpeechToTextProvider extends HTMLElement {
  start(): void;
  stop(): void;
  abort(): void;
}

export interface TextToSpeechProvider extends HTMLElement {
  queue(text: string): void;
  clear(): void;
}

export interface LlmProvider extends HTMLElement {
  submit(text: string): void;
  clear(): void;
  registerTools?(tools: Tool[]): void;
  appendAssitanceMessage(text: string): void;
}

export interface AzureConnectionProvider extends HTMLElement {
  getAzureConnection(): {
    aoaiEndpoint: string;
    aoaiDeploymentName: string;
    aoaiKey: string;
    speechRegion: string;
    speechKey: string;
  };
}

export interface Tool {
  name: string;
  parameterOptions: string[];
}

export class AIBar extends HTMLElement {
  shadowRoot = attachShadowHtml(
    this,
    `
    <style>
:host {
  *,*::before,*::after {
    box-sizing: border-box;
  }

  #widget-container {
    bottom: 0;
    right: 0;
    position: fixed;
    display: flex;
    transform: translate(var(--offsetX, 0), var(--offsetY, 0));
    box-shadow: 0 3px 7px 0 rgba(0, 0, 0, .13), 0 1px 2px 0 rgba(0, 0, 0, .11);
    z-index: 2147483647;
  }
}
    </style>
    <div id="widget-container">
      <slot name="toolbar"></slot>
    </div>
`
  );

  connectedCallback() {
    this.querySelector("script")?.remove();
    this.querySelectorAll(`[provides*="toolbar-item"]`).forEach((el) => el.setAttribute("slot", "toolbar"));

    this.addEventListener("event", (event) => {
      const typedEvent = event as CustomEvent<AIBarEventDetail>;
      this.handleStartRecording(typedEvent);
      this.handleFinishRecording(typedEvent);
      this.handleRecognition(typedEvent);
      this.handleGenerated(typedEvent);
      this.handleDragged(typedEvent);
      this.handleTextSubmitted(typedEvent);
      this.handleHide(typedEvent);
    });

    if (this.hasAttribute("auto-hide")) {
      setTimeout(() => {
        this.style.display = "none";
      }, 3000);
    }
  }

  public getAzureConnection() {
    const provider = this.querySelector<AzureConnectionProvider>(`[provides*="aoai-credentials"]`);
    if (!provider) throw new Error("No credentials provider found");

    const cred = provider.getAzureConnection();
    if (!cred) throw new Error("No credential provided by the provider");

    return cred;
  }

  public startRecording(options?: { tools?: Tool[] }) {
    this.querySelector<TextToSpeechProvider>(`[provides*="tts"]`)?.clear();
    this.querySelector<SpeechToTextProvider>(`[provides*="stt"]`)?.start();

    this.querySelector<LlmProvider>(`[provides*="llm"]`)?.registerTools?.(options?.tools ?? []);
  }

  public endRecording() {
    this.querySelector<SpeechToTextProvider>(`[provides*="stt"]`)?.stop();
  }

  public speak(content: string) {
    this.querySelector<LlmProvider>(`[provides*="llm"]`)?.appendAssitanceMessage(content);
  }

  private handleStartRecording(typedEvent: CustomEvent<AIBarEventDetail>) {
    if (!typedEvent.detail.pttPressed) return;
    typedEvent.stopPropagation();

    this.querySelector<TextToSpeechProvider>(`[provides*="tts"]`)?.clear();
    this.querySelector<SpeechToTextProvider>(`[provides*="stt"]`)?.start();
  }

  private handleFinishRecording(typedEvent: CustomEvent<AIBarEventDetail>) {
    if (!typedEvent.detail.pttReleased) return;
    typedEvent.stopPropagation();

    this.querySelector<SpeechToTextProvider>(`[provides*="stt"]`)?.stop();
  }

  private handleRecognition(typedEvent: CustomEvent<AIBarEventDetail>) {
    if (!typedEvent.detail.recognized) return;
    typedEvent.stopPropagation();

    if (typedEvent.detail.recognized.isFinal) {
      this.querySelector<LlmProvider>(`[provides*="llm"]`)?.submit(typedEvent.detail.recognized.text);
    }
  }

  private handleGenerated(typedEvent: CustomEvent<AIBarEventDetail>) {
    if (!typedEvent.detail.sentenceGenerated) return;
    typedEvent.stopPropagation();

    // assuming whole sentence
    console.log(`AI > ${typedEvent.detail.sentenceGenerated}`);
    const toolUsePattern = /<use-tool name="([^"]+)" parameter="([^"]+)"><\/use-tool>/;

    const match = typedEvent.detail.sentenceGenerated.match(toolUsePattern);
    if (match) {
      const name = match[1];
      const parameter = match[2];
      console.log({ name, parameter });
      this.dispatchEvent(new CustomEvent("use-tool", { detail: { name, parameter } }));
    }

    const textWithoutToolUse = typedEvent.detail.sentenceGenerated.replace(toolUsePattern, "").trim();

    if (textWithoutToolUse) {
      this.querySelector<TextToSpeechProvider>(`[provides*="tts"]`)?.queue(textWithoutToolUse);
    }
  }

  private handleDragged(typedEvent: CustomEvent<AIBarEventDetail>) {
    if (!typedEvent.detail.dragged) return;
    typedEvent.stopPropagation();

    this.style.setProperty("--offsetX", typedEvent.detail.dragged.deltaX + "px");
    this.style.setProperty("--offsetY", typedEvent.detail.dragged.deltaY + "px");
  }

  private handleTextSubmitted(typedEvent: CustomEvent<AIBarEventDetail>) {
    if (!typedEvent.detail.textSubmitted) return;
    typedEvent.stopPropagation();

    this.querySelector<LlmProvider>(`[provides*="llm"]`)?.submit(typedEvent.detail.textSubmitted);
  }

  private handleHide(typedEvent: CustomEvent<AIBarEventDetail>) {
    if (!typedEvent.detail.hide) return;
    typedEvent.stopPropagation();

    this.style.display = "none";
  }
}

export function defineAIBar(tagName = "ai-bar") {
  customElements.define(tagName, AIBar);
}

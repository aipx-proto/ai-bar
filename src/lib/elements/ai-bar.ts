import { attachShadowHtml } from "../wc-utils/attach-html";
import type { AIButtonEventData } from "./events";

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
}

export interface AzureOpenAIProvider extends HTMLElement {
  getAzureOpenAICredentials(): {
    endpoint: string;
    deploymentName: string;
    key: string;
  };
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
      const typedEvent = event as CustomEvent<AIButtonEventData>;
      this.handleStartRecording(typedEvent);
      this.handleFinishRecording(typedEvent);
      this.handleRecognition(typedEvent);
      this.handleGenerated(typedEvent);
      this.handleDragged(typedEvent);
      this.handleTextSubmitted(typedEvent);
    });
  }

  public getAzureOpenAICredentials() {
    const provider = this.querySelector<AzureOpenAIProvider>(`[provides*="aoai-credentials"]`);
    if (!provider) throw new Error("No credentials provider found");

    const cred = provider.getAzureOpenAICredentials();
    if (!cred) throw new Error("No credential provided by the provider");

    return cred;
  }

  private handleStartRecording(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.pttPressed) return;
    typedEvent.stopPropagation();

    this.querySelector<TextToSpeechProvider>(`[provides*="tts"]`)?.clear();
    this.querySelector<SpeechToTextProvider>(`[provides*="stt"]`)?.start();
  }

  private handleFinishRecording(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.pttReleased) return;
    typedEvent.stopPropagation();

    this.querySelector<SpeechToTextProvider>(`[provides*="stt"]`)?.stop();
  }

  private handleRecognition(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.recognized) return;
    typedEvent.stopPropagation();

    if (typedEvent.detail.recognized.isFinal) {
      this.querySelector<LlmProvider>(`[provides*="llm"]`)?.submit(typedEvent.detail.recognized.text);
    }
  }

  private handleGenerated(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.sentenceGenerated) return;
    typedEvent.stopPropagation();

    // assuming whole sentence
    this.querySelector<TextToSpeechProvider>(`[provides*="tts"]`)?.queue(typedEvent.detail.sentenceGenerated);
  }

  private handleDragged(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.dragged) return;
    typedEvent.stopPropagation();

    this.style.setProperty("--offsetX", typedEvent.detail.dragged.deltaX + "px");
    this.style.setProperty("--offsetY", typedEvent.detail.dragged.deltaY + "px");
  }

  private handleTextSubmitted(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.textSubmitted) return;
    typedEvent.stopPropagation();

    this.querySelector<LlmProvider>(`[provides*="llm"]`)?.submit(typedEvent.detail.textSubmitted);
  }
}

export function defineAIBar(tagName = "ai-bar") {
  customElements.define(tagName, AIBar);
}

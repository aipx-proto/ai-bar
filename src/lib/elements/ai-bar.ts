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
  display: flex;

  *,*::before,*::after {
    box-sizing: border-box;
  }

  button,
  input {
    font: inherit;
    padding: 0.25rem;
  }


  transform: translate(var(--offsetX, 0), var(--offsetY, 0));
}
    </style>
    <slot name="toolbar"></slot>
`
  );

  connectedCallback() {
    this.querySelector("drag-handle")?.setAttribute("slot", "toolbar");
    this.querySelector("aoai-connection-button")?.setAttribute("slot", "toolbar");
    this.querySelector("walkie-talkie-button")?.setAttribute("slot", "toolbar");

    this.querySelector("script")?.remove();

    this.addEventListener("event", (event) => {
      const typedEvent = event as CustomEvent<AIButtonEventData>;
      this.handleStartRecording(typedEvent);
      this.handleFinishRecording(typedEvent);
      this.handleRecognition(typedEvent);
      this.handleGenerated(typedEvent);
      this.handleDragged(typedEvent);
    });
  }

  public getAzureOpenAICredentials() {
    const provider = this.querySelector<AzureOpenAIProvider>(`[provides="aoai-credentials"]`);
    if (!provider) throw new Error("No credentials provider found");

    const cred = provider.getAzureOpenAICredentials();
    if (!cred) throw new Error("No credential provided by the provider");

    return cred;
  }

  private handleStartRecording(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.pttPressed) return;
    typedEvent.stopPropagation();

    this.querySelector<TextToSpeechProvider>(`[provides="tts"]`)?.clear();
    this.querySelector<SpeechToTextProvider>(`[provides="stt"]`)?.start();
  }

  private handleFinishRecording(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.pttReleased) return;
    typedEvent.stopPropagation();

    this.querySelector<SpeechToTextProvider>(`[provides="stt"]`)?.stop();
  }

  private handleRecognition(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.recognized) return;
    typedEvent.stopPropagation();

    if (typedEvent.detail.recognized.isFinal) {
      this.querySelector<LlmProvider>(`[provides="llm"]`)?.submit(typedEvent.detail.recognized.text);
    }
  }

  private handleGenerated(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.sentenceGenerated) return;
    typedEvent.stopPropagation();

    // assuming whole sentence
    this.querySelector<TextToSpeechProvider>(`[provides="tts"]`)?.queue(typedEvent.detail.sentenceGenerated);
  }

  private handleDragged(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.dragged) return;
    typedEvent.stopPropagation();

    this.style.setProperty("--offsetX", typedEvent.detail.dragged.deltaX + "px");
    this.style.setProperty("--offsetY", typedEvent.detail.dragged.deltaY + "px");
  }
}

export function defineAIBar(tagName = "ai-bar") {
  customElements.define(tagName, AIBar);
}

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
  connectedCallback() {
    const stylesheet = document.createElement("style");
    stylesheet.innerHTML = `
ai-bar {
  display: flex;
  font-family: monospace;

  *,*::before,*::after {
    box-sizing: border-box;
  }

  button,
  input {
    font: inherit;
    padding: 0.25rem;
  }
}
    `;

    this.appendChild(stylesheet);

    this.querySelector("script")?.remove();

    this.addEventListener("event", (event) => {
      const typedEvent = event as CustomEvent<AIButtonEventData>;
      this.handleStartRecording(typedEvent);
      this.handleFinishRecording(typedEvent);
      this.handleRecognition(typedEvent);
      this.handleGenerated(typedEvent);
    });
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

  public getAzureOpenAICredentials() {
    const provider = this.querySelector<AzureOpenAIProvider>(`[provides="aoai-credentials"]`);
    if (!provider) throw new Error("No credentials provider found");

    const cred = provider.getAzureOpenAICredentials();
    if (!cred) throw new Error("No credential provided by the provider");

    return cred;
  }
}

export function defineAIBar(tagName = "ai-bar") {
  customElements.define(tagName, AIBar);
}

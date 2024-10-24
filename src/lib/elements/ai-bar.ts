import type { AIButtonEventData } from "./events";

export interface SttProvider extends HTMLElement {
  start(): void;
  stop(): void;
  abort(): void;
}

export interface LlmProvider extends HTMLElement {
  submit(text: string): void;
  clear(): void;
}

export interface AoaiCredentialsProvider extends HTMLElement {
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

    this.addEventListener;
  }

  private handleStartRecording(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.pttPressed) return;
    typedEvent.stopPropagation();

    this.querySelector<SttProvider>(`[provides="stt"]`)?.start();
  }

  private handleFinishRecording(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.pttReleased) return;
    typedEvent.stopPropagation();

    this.querySelector<SttProvider>(`[provides="stt"]`)?.stop();
  }

  private handleRecognition(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.recognized) return;
    typedEvent.stopPropagation();

    this.querySelector<LlmProvider>(`[provides="llm"]`)?.submit(typedEvent.detail.recognized.text);
  }

  private handleGenerated(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.generated) return;
    typedEvent.stopPropagation();

    console.log(typedEvent.detail.generated);
  }

  public getAzureOpenAICredentials() {
    const provider = this.querySelector<AoaiCredentialsProvider>(`[provides="aoai-credentials"]`);
    if (!provider) throw new Error("No credentials provider found");

    const cred = provider.getAzureOpenAICredentials();
    if (!cred) throw new Error("No credential provided by the provider");

    return cred;
  }
}

export function defineAIAvatar(tagName = "ai-bar") {
  customElements.define(tagName, AIBar);
}

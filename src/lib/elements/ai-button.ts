import type { AIButtonEventData } from "./events";
import type { SttProvider } from "./stt-node";

export class AIButton extends HTMLElement {
  connectedCallback() {
    this.querySelector("script")?.remove();

    this.addEventListener("event", (event) => {
      const typedEvent = event as CustomEvent<AIButtonEventData>;
      this.handleStartRecording(typedEvent);
      this.handleFinishRecording(typedEvent);
      this.handleRecognition(typedEvent);
    });

    this.addEventListener;
  }

  private handleStartRecording(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.pttPressed) return;
    typedEvent.stopPropagation();

    this.querySelector<SttProvider>(`[data-node="stt"]`)?.start();
  }

  private handleFinishRecording(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.pttReleased) return;
    typedEvent.stopPropagation();

    this.querySelector<SttProvider>(`[data-node="stt"]`)?.stop();
  }

  private handleRecognition(typedEvent: CustomEvent<AIButtonEventData>) {
    if (!typedEvent.detail.recognized) return;
    typedEvent.stopPropagation();

    console.log(typedEvent.detail.recognized.text);
  }
}

export function defineAIAvatar(tagName = "ai-button") {
  customElements.define(tagName, AIButton);
}

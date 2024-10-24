import type { TextToSpeechProvider } from "./ai-bar";

export class TtsNode extends HTMLElement implements TextToSpeechProvider {
  private synth = window.speechSynthesis;

  constructor() {
    super();
  }
  connectedCallback() {
    this.setAttribute("provides", "tts");
  }

  queue(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    const preferredVoices = ["Microsoft Sonia Online (Natural) - English (United Kingdom)", "Arthur"];

    const matchedVoice = this.synth.getVoices().find((voice) => preferredVoices.includes(voice.name));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    this.synth.speak(utterance);
  }

  clear() {
    this.synth.cancel();
  }
}

export function defineTtsNode(tagName = "tts-node") {
  customElements.define(tagName, TtsNode);
}

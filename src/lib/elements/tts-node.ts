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
    utterance.rate = 1.2;
    const preferredVoicesURIs = [
      "Microsoft AvaMultilingual Online (Natural) - English (United States)",
      "Microsoft Sonia Online (Natural) - English (United Kingdom)",
      "Arthur",
    ];

    const availableVoices = this.synth.getVoices().filter((v) => preferredVoicesURIs.includes(v.voiceURI));
    const bestVoice = availableVoices.sort((a, b) => preferredVoicesURIs.indexOf(a.voiceURI) - preferredVoicesURIs.indexOf(b.voiceURI)).at(0);
    if (bestVoice) utterance.voice = bestVoice;

    this.synth.speak(utterance);
  }

  clear() {
    this.synth.cancel();
  }
}

export function defineTtsNode(tagName = "tts-node") {
  customElements.define(tagName, TtsNode);
}

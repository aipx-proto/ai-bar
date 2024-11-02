import type { AOAIAccess } from "./azure-openai-access";
import { assistant, system, user } from "./lib/message";

export class AIImage extends HTMLElement {
  static observedAttributes = ["prompt"];

  shadowRoot = this.attachShadow({ mode: "open" });

  connectedCallback() {
    this.generate();
    this.shadowRoot.innerHTML = `
    <style>
    img {
      display: block;
      max-width: 100%;
    }
    </style>
    <img src='https://placehold.co/128' alt='Empty' />`;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "prmopt" && oldValue !== newValue) {
      if (!name.trim()) {
        this.shadowRoot.innerHTML = "<img src='https://placehold.co/400' alt='Empty' />";
        return;
      }

      this.generate();
    }
  }

  private async generate() {
    const client = document.querySelector<AOAIAccess>("aoai-access")?.getClient();
    if (!client) throw new Error("Azure OpenAI client not found");

    const response = await client.chat.completions.create({
      messages: [
        system`Generate a placehold.co placeholder image based on user prompt. Do not change color, background, text unless asked by user. If no text needed, display aspect ratio`,
        user`Basic placeholder`,
        assistant`<img src="https://placehold.co/128?text=1:1" alt="128 pixel square" />`,
        user`Dark background placeholder`,
        assistant`<img src="https://placehold.co/444444/FFF?text=1:1" alt="square with dark background white text" />`,
        user`Product screenshot scemantic`,
        assistant`<img src="https://placehold.co/1600x900?text=Product+screenshot\\n16:9" alt="Product screenshot landscape" />`,
        user`Product screenshot portrait with multiline text`,
        assistant`<img src="https://placehold.co/400x600?text=First+line\\nSecond+line\\n2:3" alt="Product screenshot portrait with multiline text" />`,
        user`${this.getAttribute("prompt")}`,
      ],
      model: "gpt-4o-mini",
      temperature: 0,
    });

    const content = response.choices.at(0)?.message?.content;
    if (content) {
      const template = document.createElement("template");
      template.innerHTML = content;
      this.shadowRoot.querySelector("img")!.replaceWith(template.content.cloneNode(true)!);
    } else {
      this.shadowRoot.querySelector("img")!.src = "https://placehold.co/400?text=Error";
    }
  }
}

export function defineAIImage(tagName = "ai-image") {
  customElements.define(tagName, AIImage);
}

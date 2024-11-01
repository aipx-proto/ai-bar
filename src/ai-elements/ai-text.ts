import * as htmlparser2 from "htmlparser2";
import { AOAIAccess } from "./azure-openai-access";
import { assistant, system, user } from "./lib/message";

export class AIText extends HTMLElement {
  static observedAttributes = ["prompt"];

  shadowRoot = this.attachShadow({ mode: "open" });

  connectedCallback() {
    this.generateTextContent();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "prmopt" && oldValue !== newValue) {
      if (!name.trim()) {
        this.shadowRoot.innerHTML = "<empty>";
        return;
      }

      this.generateTextContent();
    }
  }

  private async generateTextContent() {
    const client = document.querySelector<AOAIAccess>("aoai-access")?.getClient();
    if (!client) throw new Error("Azure OpenAI client not found");

    this.shadowRoot.innerHTML = "<generating...>";

    const responseStream = await client.chat.completions.create({
      stream: true,
      messages: [
        system`You are a skilled UI content designer. Based on user provided description or placeholder, write realist label for web app UI. Wrap your response in <ui-label> tag.`,
        user`<ui-placeholder>Call to action text for user to engage customer support</ui-placeholder>`,
        assistant`<ui-label>Get help</ui-label>`,
        user`${this.getAttribute("prompt")}`,
      ],
      model: "gpt-4o-mini",
    });

    let isInTag = false;
    const parser = new htmlparser2.Parser({
      onopentag: (name) => {
        if (name === "ui-label") {
          isInTag = true;
        }
      },
      ontext: (text) => {
        if (!isInTag) return;
        this.shadowRoot!.innerHTML += text;
      },
      onclosetag: (name) => {
        if (name === "ui-label") {
          isInTag = false;
        }
      },
    });

    for await (const response of responseStream) {
      const delta = response.choices.at(0)?.delta?.content;
      if (delta) parser.write(delta);
    }

    parser.end();
  }
}

export function defineAIText(tagName = "ai-text") {
  customElements.define(tagName, AIText);
}

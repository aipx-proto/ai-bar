import { AOAIAccess } from "./azure-openai-access";
import { assistant, system, user } from "./lib/message";
import { getTagInnerHtmlStream, toTextStream as toHtmlStream } from "./lib/parser";

export class AIText extends HTMLElement {
  static observedAttributes = ["prompt"];

  shadowRoot = this.attachShadow({ mode: "open" });

  connectedCallback() {
    this.generate();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "prmopt" && oldValue !== newValue) {
      if (!name.trim()) {
        this.shadowRoot.innerHTML = "<empty>";
        return;
      }

      this.generate();
    }
  }

  private async generate() {
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

    this.shadowRoot.innerHTML = "";

    const htmlStream = toHtmlStream(responseStream);
    await getTagInnerHtmlStream({
      tagName: "ui-label",
      htmlStream,
      onInnerHtmlDelta: (text) => (this.shadowRoot!.innerHTML += text),
    });
  }
}

export function defineAIText(tagName = "ai-text") {
  customElements.define(tagName, AIText);
}

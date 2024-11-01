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

    client.chat.completions
      .create({
        messages: [
          system`Generate unformatted plaintext UI label based on user provided goal or instruction`,
          user`<p placeholder="Customer service CTA button label"></p>`,
          assistant`<p>Get help</p>`,
          user`${this.getAttribute("prompt")}`,
        ],
        model: "gpt-4o-mini",
      })
      .then((response) => {
        const completion = response.choices.at(0)?.message.content;
        if (!completion) throw new Error("No text generated");

        this.shadowRoot.innerHTML = completion;
      })
      .catch((error) => {
        this.shadowRoot.innerHTML = error.message;
      });
  }
}

export function defineAIText(tagName = "ai-text") {
  customElements.define(tagName, AIText);
}

import { attachShadowHtml } from "../wc-utils/attach-html";
import type { AzureOpenAIProvider } from "./ai-bar";

export class AoaiConnectionButton extends HTMLElement implements AzureOpenAIProvider {
  shadowRoot = attachShadowHtml(
    this,
    `
<style>
:host {
  .two-column {
    display: grid;
  }

  input + label {
    margin-top: 0.5rem;
  }

  form {
    display: grid;
    gap: 1rem;
  }
}
</style>
<button>⚙️</button>
<dialog style="width: min(40rem, calc(100vw - 32px))">
  <h2>Azure OpenAI Connection</h2>
  <form method="dialog" id="creds-form">
    <div class="two-column">
      <label for="aoai-endpoint">AOAI Endpoint</label>
      <input type="url" id="aoai-endpoint" name="aoai-endpoint"
        placeholder="https://replace-endpoint-name.openai.azure.com/" />
      <label for="aoai-deployment-name">AOAI Deployment Name</label>
      <input type="text" id="aoai-deployment-name" name="aoai-deployment-name" placeholder="my-gpt-4o" />
      <label for="aoai-key">AOAI Key</label>
      <input type="password" id="aoai-key" name="aoai-key" />
    </div>
    <button>Done</button>
  </form>
</dialog>
    `
  );

  connectedCallback() {
    this.setAttribute("provides", "aoai-credentials");
    this.shadowRoot.querySelector("button")?.addEventListener("click", () => {
      this.shadowRoot.querySelector("dialog")?.showModal();
    });

    const credsForm = this.shadowRoot.querySelector<HTMLFormElement>("#creds-form")!;

    credsForm.addEventListener("change", () => {
      const formData = new FormData(credsForm);
      const dataEntries = formData.entries();
      const dataDict = Object.fromEntries(dataEntries);
      localStorage.setItem("creds", JSON.stringify(dataDict));
      handleCredsChange(dataDict as Record<string, string>);
    });
    // immediately load creds from local storage at the start
    handleCredsChange(JSON.parse(localStorage.getItem("creds") ?? "{}"));

    async function handleCredsChange(creds: Record<string, string>) {
      Object.entries(creds).forEach(([key, value]) => {
        const field = credsForm.querySelector(`[name="${key}"]`) as HTMLInputElement;
        if (!field) return;
        field.value = value as string;
      });
    }
  }

  public getAzureOpenAICredentials() {
    const endpoint = this.shadowRoot.querySelector<HTMLInputElement>("#aoai-endpoint")!.value;
    const deploymentName = this.shadowRoot.querySelector<HTMLInputElement>("#aoai-deployment-name")!.value;
    const key = this.shadowRoot.querySelector<HTMLInputElement>("#aoai-key")!.value;

    return { endpoint, deploymentName, key };
  }
}

export function defineAoaiConnectionButton(tagName = "aoai-connection-button") {
  customElements.define(tagName, AoaiConnectionButton);
}

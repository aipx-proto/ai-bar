import type { AzureConnectionProvider } from "../ai-bar";
import { attachShadowHtml } from "../wc-utils/attach-html";

export class AoaiConnectionButton extends HTMLElement implements AzureConnectionProvider {
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
<button title="Setup">⚙️</button>
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

      <label for="speech-region">Speech region</label>
      <input type="text" id="speech-region" name="speech-region" placeholder="eastus" />

      <label for="speech-key">Speech key</label>
      <input type="password" id="speech-key" name="speech-key" />
    </div>
    <button>Done</button>
  </form>
</dialog>
    `
  );

  connectedCallback() {
    this.setAttribute("provides", "aoai-credentials, toolbar-item");
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

  public getAzureConnection() {
    const aoaiEndpoint = this.shadowRoot.querySelector<HTMLInputElement>("#aoai-endpoint")!.value;
    const aoaiDeploymentName = this.shadowRoot.querySelector<HTMLInputElement>("#aoai-deployment-name")!.value;
    const aoaiKey = this.shadowRoot.querySelector<HTMLInputElement>("#aoai-key")!.value;
    const speechRegion = this.shadowRoot.querySelector<HTMLInputElement>("#speech-region")!.value;
    const speechKey = this.shadowRoot.querySelector<HTMLInputElement>("#speech-key")!.value;

    return { aoaiEndpoint, aoaiDeploymentName, aoaiKey, speechRegion, speechKey };
  }
}

export function defineAzureConnection(tagName = "azure-connection") {
  customElements.define(tagName, AoaiConnectionButton);
}

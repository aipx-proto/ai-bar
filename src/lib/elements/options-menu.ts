import type { AoaiCredentialsProvider } from "./ai-bar";

export class OptionsMenu extends HTMLElement implements AoaiCredentialsProvider {
  connectedCallback() {
    this.setAttribute("provides", "aoai-credentials");

    this.innerHTML = `
<style>
options-menu {
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
    `;

    this.querySelector("button")?.addEventListener("click", () => {
      this.querySelector("dialog")?.showModal();
    });

    const credsForm = this.querySelector<HTMLFormElement>("#creds-form")!;

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
    const endpoint = this.querySelector<HTMLInputElement>("#aoai-endpoint")!.value;
    const deploymentName = this.querySelector<HTMLInputElement>("#aoai-deployment-name")!.value;
    const key = this.querySelector<HTMLInputElement>("#aoai-key")!.value;

    return { endpoint, deploymentName, key };
  }
}

export function defineOptionsMenu(tagName = "options-menu") {
  customElements.define(tagName, OptionsMenu);
}

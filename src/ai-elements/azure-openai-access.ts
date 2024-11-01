import { getBearerTokenProvider, InteractiveBrowserCredential } from "@azure/identity";
import { AzureOpenAI } from "openai";

export class AOAIAccess extends HTMLElement {
  private client!: AzureOpenAI;

  connectedCallback() {
    if (!this.hasAttribute("tenantId")) throw new Error("tenantId is required");
    if (!this.hasAttribute("clientId")) throw new Error("clientId is required");
    if (!this.hasAttribute("endpoint")) throw new Error("endpoint is required");

    const credential = new InteractiveBrowserCredential({
      tenantId: this.getAttribute("tenantId")!,
      clientId: this.getAttribute("clientId")!,
    });
    const azureADTokenProvider = getBearerTokenProvider(credential, []);
    this.client = new AzureOpenAI({
      azureADTokenProvider,
      apiVersion: this.getAttribute("apiVersion") ?? "2024-10-01-preview",
      endpoint: this.getAttribute("endpoint")!,
    });
  }

  public getClient() {
    return this.client;
  }
}

export function defineAOAIAccess(tagName = "aoai-access") {
  customElements.define(tagName, AOAIAccess);
}

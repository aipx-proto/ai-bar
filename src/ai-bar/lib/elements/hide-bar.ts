import { emit } from "../ai-bar";
import { attachShadowHtml } from "../wc-utils/attach-html";

export class HideBar extends HTMLElement {
  shadowRoot = attachShadowHtml(this, `<button title="Hide">😶‍🌫️</button>`);

  connectedCallback() {
    this.setAttribute("provides", "toolbar-item");

    this.shadowRoot.querySelector("button")?.addEventListener("click", () => {
      emit(this, { hide: true });
    });
  }
}

export function defineHideBar(tagName = "hide-bar") {
  customElements.define(tagName, HideBar);
}

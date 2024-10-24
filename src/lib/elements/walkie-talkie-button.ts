import { attachShadowHtml } from "../wc-utils/attach-html";
import { emit } from "./events";

export class WalkieTalkieButton extends HTMLElement {
  shadowRoot = attachShadowHtml(
    this,
    `
<button>
  <span part="leading-visual">🎙️</span>
  <span part="label">Hold to talk</span>
</button>
    `
  );

  connectedCallback() {
    this.setAttribute("provides", "toolbar-item");
    this.shadowRoot.querySelector("button")!.addEventListener("mousedown", () => {
      emit(this, {
        pttPressed: true,
      });
      this.shadowRoot.querySelector<HTMLElement>(`[part="label"]`)!.innerText = "Release to send";
    });

    this.shadowRoot.querySelector("button")!.addEventListener("mouseup", () => {
      emit(this, {
        pttReleased: true,
      });
      this.shadowRoot.querySelector<HTMLElement>(`[part="label"]`)!.innerText = "Hold to talk";
    });
  }
}

export function defineWalkieTalkieButton(tagName = "walkie-talkie-button") {
  customElements.define(tagName, WalkieTalkieButton);
}

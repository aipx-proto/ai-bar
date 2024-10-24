import { emit } from "./events";

export class WalkieTalkieButton extends HTMLElement {
  connectedCallback() {
    const button = document.createElement("button");
    button.innerHTML = `<span part="leading-visual">🎙️</span><span part="label">Hold to talk</span>`;

    button.addEventListener("mousedown", () => {
      emit(this, {
        pttPressed: true,
      });
      this.querySelector<HTMLElement>(`[part="label"]`)!.innerText = "Release to send";
    });

    button.addEventListener("mouseup", () => {
      emit(this, {
        pttReleased: true,
      });
      this.querySelector<HTMLElement>(`[part="label"]`)!.innerText = "Hold to talk";
    });

    this.appendChild(button);
  }
}

export function defineWalkieTalkieButton(tagName = "walkie-talkie-button") {
  customElements.define(tagName, WalkieTalkieButton);
}

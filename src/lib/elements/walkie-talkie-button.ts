import { emit } from "./events";

export class WalkieTalkieButton extends HTMLElement {
  connectedCallback() {
    const button = document.createElement("button");
    button.innerHTML = `🎙️<span>Push to talk</span>`;

    button.addEventListener("mousedown", () => {
      emit(this, {
        pttPressed: true,
      });
    });

    button.addEventListener("mouseup", () => {
      emit(this, {
        pttReleased: true,
      });
    });

    this.appendChild(button);
  }
}

export function defineWalkieTalkieButton(tagName = "walkie-talkie-button") {
  customElements.define(tagName, WalkieTalkieButton);
}

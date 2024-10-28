import { attachShadowHtml } from "../wc-utils/attach-html";
import { emit } from "./events";

export class TextChat extends HTMLElement {
  shadowRoot = attachShadowHtml(
    this,
    `
<style>
.popover-container {
  position: relative;

  [popover] {
    display: none;
  }

  [data-popover-surface] {
    display: none;
  }

  &:has([popover]:popover-open) [data-popover-surface] {
    display: grid;
    position: absolute;
    top: 100%;
    left: 0;
  }
}


</style>
<div class="popover-container">
  <button popovertarget="chat-view" title="Text chat">💬</button>
  <form data-popover-surface>
    <input name="prompt" type="text" />
    <div id="thread"></div>
  </form>
  <div popover="manual" id="chat-view"></div>
</div>
    `.trim()
  );

  connectedCallback() {
    this.setAttribute("provides", "toolbar-item");

    this.querySelector;

    this.shadowRoot.querySelector("form")!.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const prompt = new FormData(form).get("prompt") as string;
      form.reset();
      emit(this, { textSubmitted: prompt });
    });
  }
}

export function defineTextChat(tagName = "text-chat") {
  customElements.define(tagName, TextChat);
}

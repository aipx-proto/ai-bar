import { attachShadowHtml } from "../../ai-bar/lib/wc-utils/attach-html";
import attentionRing from "../attention-ring.svg?url";

export class AISandbox extends HTMLElement {
  shadowRoot = attachShadowHtml(
    this,
    `
<style>
:host {
  display: block;
  --dot-color: currentColor;
  background-image: radial-gradient(color-mix(in srgb, var(--dot-color), transparent 80%), 1px, transparent 0);
  background-size: 20px 20px;
  background-position: -9px -9px;

  cursor: url("${attentionRing}") 32 32, auto;
}
</style>
<slot></slot>
    `
  );
}

export function defineAISandbox(tagName = "ai-sandbox") {
  customElements.define(tagName, AISandbox);
}

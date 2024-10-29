import type { AIBar } from "./ai-bar/lib/ai-bar";
import type { AISandbox } from "./ai-sandbox/lib/ai-sandbox";

const bar = document.querySelector<AIBar>("ai-bar")!;
const sandbox = document.querySelector<AISandbox>("ai-sandbox")!;

sandbox.addEventListener("mousedown", () => {
  bar.startRecording();
});

sandbox.addEventListener("mouseup", () => {
  bar.finishRecording();
});

import p5 from "p5";
import { defineVoiceNode, VoiceNode } from "./lib/voice-node";

defineVoiceNode();

const voiceNode = document.querySelector<VoiceNode>("voice-node")!;
const p5Container = document.querySelector<HTMLDivElement>("#root")!;

const credsForm = document.querySelector<HTMLFormElement>("#creds-form")!;

credsForm.addEventListener("submit", (event) => event.preventDefault());
credsForm.addEventListener("change", () => {
  const formData = new FormData(credsForm);
  const dataEntries = formData.entries();
  const dataDict = Object.fromEntries(dataEntries);
  localStorage.setItem("creds", JSON.stringify(dataDict));
  handleCredsChange(dataDict as Record<string, string>);
});

handleCredsChange(JSON.parse(localStorage.getItem("creds") ?? "{}")); // initial load

function handleCredsChange(creds: Record<string, string>) {
  Object.entries(creds).forEach(([key, value]) => {
    (credsForm.querySelector(`[name="${key}"]`) as HTMLInputElement)!.value = value as string;
  });

  voiceNode.setAttribute("data-api-key", creds["speech-key"]);
}

const thread = [{ role: "system", content: "You are an expert in business process modeling. Guide user to best model their business process." }];

voiceNode.addEventListener("transcriptiondone", (event) => {
  const text = (event as CustomEvent).detail;
  thread.push({ role: "user", content: text });
});

const sketch = (p: p5) => {
  let x = 100;
  let y = 100;

  p.setup = function () {
    const canvas = p.createCanvas(800, 400);
    canvas.mousePressed(() => voiceNode?.startRecording());
    canvas.mouseReleased(() => voiceNode?.finishRecording());
  };

  p.draw = function () {
    p.background(0);
    p.fill(255);
    p.rect(x, y, 50, 50);
  };
};

new p5(sketch, p5Container);

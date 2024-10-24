import { AzureOpenAI } from "openai";
import type { Assistant } from "openai/resources/beta/assistants";
import p5 from "p5";
import { defineVoiceNode, VoiceNode } from "./lib/voice-node";

defineVoiceNode();

const voiceNode = document.querySelector<VoiceNode>("voice-node")!;
const p5Container = document.querySelector<HTMLDivElement>("#root")!;
const credsForm = document.querySelector<HTMLFormElement>("#creds-form")!;
let aoaiClient: AzureOpenAI;
let threadId: string;
let assistant: Assistant;
let ac: AbortController;

credsForm.addEventListener("submit", (event) => event.preventDefault());
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
    (credsForm.querySelector(`[name="${key}"]`) as HTMLInputElement)!.value = value as string;
  });

  voiceNode.setAttribute("data-api-key", creds["speech-key"]);

  aoaiClient = new AzureOpenAI({
    dangerouslyAllowBrowser: true,
    apiKey: creds["aoai-key"] as string,
    apiVersion: "2024-07-01-preview",
    endpoint: creds["aoai-endpoint"] as string,
  });
  assistant = await aoaiClient.beta.assistants.retrieve(creds["aoai-assistant-id"] as string);
  console.log(`[chat] assistant id: ${assistant.id}`);
  if (!threadId) {
    const thread = await aoaiClient.beta.threads.create({});
    threadId = thread.id;
    console.log(`[chat] thread id: ${threadId}`);
  }
}

voiceNode.addEventListener("transcriptiondone", async (event) => {
  const text = (event as CustomEvent).detail;
  const response = await aoaiClient.beta.threads.messages.create(threadId!, {
    role: "user",
    content: text,
  });

  ac = new AbortController();
  let runId = "";
  const run = aoaiClient.beta.threads.runs.stream(threadId!, { assistant_id: assistant.id }, { signal: ac.signal });

  run
    .on("event", (e) => {
      if (e.event === "thread.run.created") runId = e.data.id;
    })
    .on("textCreated", () => console.log("\nassistant > "))
    .on("textDelta", (textDelta) => console.log(textDelta.value))
    .on("toolCallCreated", (toolCall) => console.log(`\nassistant > ${toolCall.type}\n\n`))
    .on("toolCallDelta", (toolCallDelta, snapshot) => {
      // you can print out tool call intermediate results here
    });

  ac.signal.addEventListener("abort", () => aoaiClient.beta.threads.runs.cancel(threadId!, runId));

  console.log(response.content);
});

const sketch = (p: p5) => {
  let x = 100;
  let y = 100;

  p.setup = function () {
    const canvas = p.createCanvas(800, 400);
    canvas.mousePressed(() => {
      voiceNode?.startRecording();
      ac?.abort();
    });
    canvas.mouseReleased(() => voiceNode?.finishRecording());
  };

  p.draw = function () {
    p.background(0);
    p.fill(255);
    p.rect(x, y, 50, 50);
  };
};

new p5(sketch, p5Container);

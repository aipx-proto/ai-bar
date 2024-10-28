import { defineAIBar } from "./lib/elements/ai-bar";
import { defineAzureConnection } from "./lib/elements/azure-connection";
import { defineAzureTtsNode } from "./lib/elements/azure-tts-node";
import { defineDragHandle } from "./lib/elements/drag-handle";
import { defineHideBar } from "./lib/elements/hide-bar";
import { defineLlmNode } from "./lib/elements/llm-node";
import { defineScreenCapture } from "./lib/elements/screen-capture";
import { defineSttNode } from "./lib/elements/stt-node";
import { defineTextChat } from "./lib/elements/text-chat";
import { defineWalkieTalkieButton } from "./lib/elements/walkie-talkie-button";

defineAzureConnection();
defineAzureTtsNode();
defineDragHandle();
defineHideBar();
defineLlmNode();
defineScreenCapture();
defineSttNode();
defineTextChat();
defineWalkieTalkieButton();

defineAIBar();

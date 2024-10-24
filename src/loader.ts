import { defineAIBar } from "./lib/elements/ai-bar";
import { defineAoaiConnectionButton } from "./lib/elements/aoai-connection-button";
import { defineDragHandle } from "./lib/elements/drag-handle";
import { defineLlmNode } from "./lib/elements/llm-node";
import { defineSttNode } from "./lib/elements/stt-node";
import { defineTextChat } from "./lib/elements/text-chat";
import { defineTtsNode } from "./lib/elements/tts-node";
import { defineWalkieTalkieButton } from "./lib/elements/walkie-talkie-button";

defineTextChat();
defineDragHandle();
defineAoaiConnectionButton();
defineLlmNode();
defineSttNode();
defineTtsNode();
defineWalkieTalkieButton();
defineAIBar();

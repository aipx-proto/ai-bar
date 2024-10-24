import { defineAIBar } from "./lib/elements/ai-bar";
import { defineAoaiConnectionButton } from "./lib/elements/aoai-connection-button";
import { defineLlmNode } from "./lib/elements/llm-node";
import { defineSttNode } from "./lib/elements/stt-node";
import { defineTtsNode } from "./lib/elements/tts-node";
import { defineWalkieTalkieButton } from "./lib/elements/walkie-talkie-button";

defineAoaiConnectionButton();
defineLlmNode();
defineSttNode();
defineTtsNode();
defineWalkieTalkieButton();
defineAIBar();

import { defineAIImage } from "./ai-image";
import { defineAIText } from "./ai-text";
import { defineAOAIAccess } from "./azure-openai-access";

defineAOAIAccess();
defineAIText();
defineAIImage();

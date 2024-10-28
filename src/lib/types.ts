export interface SpeechToTextProvider extends HTMLElement {
  start(): void;
  stop(): void;
  abort(): void;
}

export interface TextToSpeechProvider extends HTMLElement {
  queue(text: string): void;
  clear(): void;
}

export interface LlmProvider extends HTMLElement {
  submit(text: string): void;
  clear(): void;
  registerTools?(tools: Tool[]): void;
  appendAssitanceMessage(text: string): void;
}

export interface VisionProvider extends HTMLElement {
  getImageDataUrl(): Promise<string>;
}

export interface AzureConnectionProvider extends HTMLElement {
  getAzureConnection(): {
    aoaiEndpoint: string;
    aoaiDeploymentName: string;
    aoaiKey: string;
    speechRegion: string;
    speechKey: string;
  };
}

export interface Tool {
  name: string;
  parameterOptions: string[];
}

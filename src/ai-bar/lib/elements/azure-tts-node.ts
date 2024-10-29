import { concatMap, filter, Observable, Subject, Subscription } from "rxjs";
import type { AIBar, TextToSpeechProvider } from "../ai-bar";

export function defineAzureTtsNode(tagName = "azure-tts-node") {
  customElements.define(tagName, AzureTtsNode);
}

export class AzureTtsNode extends HTMLElement implements TextToSpeechProvider {
  private sentenceQueue = createSentenceQueue();
  private audioSink = new CustomOutputStream();
  private sub: Subscription | null = null;

  connectedCallback() {
    this.setAttribute("provides", "tts");

    this.sub = this.sentenceQueue.sentenceQueue
      .pipe(
        filter((block) => !!block),
        concatMap(async (block) => {
          const connection = this.closest<AIBar>("ai-bar")?.getAzureConnection();
          if (!connection) throw new Error("Unable to get credentials from the closest <ai-bar>. Did you forget to provide them?");

          const result = await synthesizeSpeech({
            apiKey: connection.speechKey,
            region: connection.speechRegion,
            text: block,
            voice: this.getAttribute("voice") ?? undefined,
            rate: this.getAttribute("rate") ?? undefined,
          });

          return { text: block, audio: result };
        })
      )
      .subscribe((data) => this.audioSink.appendBuffer(data.audio, () => console.log(`speaking`, data.text)));
  }

  disconnectedCallback() {
    this.sub?.unsubscribe();
  }

  queue(text: string): void {
    console.log(`[azure-tts] enqueue`, text);
    this.sentenceQueue.enqueue(text);
  }
  clear(): void {
    this.audioSink.pause();
    this.audioSink.start();
  }
}

function createSentenceQueue() {
  const sentence$ = new Subject<string>();

  function enqueue(text: string) {
    if (text.trim()) {
      sentence$.next(text);
    }
  }

  return {
    sentenceQueue: sentence$ as Observable<string>,
    enqueue,
  };
}

interface InputParams {
  apiKey: string;
  text: string;
  region?: string; // default "eastus"
  voice?: string; // default "en-US-AndrewMultilingualNeural"
  rate?: string; // default 1.2
}

async function synthesizeSpeech({ apiKey, text, region, voice, rate }: InputParams): Promise<Uint8Array> {
  const ssml = `
    <speak version='1.0' xml:lang='en-US'>
      <voice xml:lang='en-US' name='${voice ?? "en-US-AndrewMultilingualNeural"}'>
        <prosody rate="${rate ?? 1.2}">
          ${text}
        </prosody>
      </voice>
    </speak>
  `;

  try {
    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: ssml,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is empty");
    }

    // response.arrayBuffer().then((buffer) => audioSink.appendBuffer(new Uint8Array(buffer)));
    return response.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  } catch (error) {
    console.error("Error synthesizing speech:", error);
    throw new Error("Error synthesizing speech. Check the console for details.");
  }
}

class CustomOutputStream {
  private audioElement?: HTMLAudioElement;
  private mediaSource?: MediaSource;
  private sourceBuffer?: SourceBuffer | null;
  private queue?: { audio: Uint8Array; callback: () => void }[];
  private rate?: number;

  private onPlayStartCallbacks: { startTime: number; callback: () => void }[] = [];

  private onStopCallback?: () => void;

  constructor(
    private options?: {
      rate?: number;
    }
  ) {}

  start(): void {
    this.audioElement = new Audio();
    this.mediaSource = new MediaSource();
    this.sourceBuffer = null;
    this.queue = [];
    this.rate = this.options?.rate ?? 1;

    this.audioElement.src = URL.createObjectURL(this.mediaSource);
    this.audioElement.addEventListener("canplay", (_e) => {
      try {
        this.audioElement!.play();
        this.audioElement!.playbackRate = this.rate ?? 1;
      } catch {}
    });

    const handleSourceopen = () => {
      this.sourceBuffer = this.mediaSource!.addSourceBuffer("audio/mpeg");
      this.sourceBuffer.addEventListener("updateend", () => this.onUpdateEnd());
    };

    const handleTimeupdate = () => {
      const playStartCallbacks = this.onPlayStartCallbacks.filter((cb) => cb.startTime <= this.audioElement!.currentTime);
      this.onPlayStartCallbacks = this.onPlayStartCallbacks.filter((cb) => cb.startTime > this.audioElement!.currentTime);
      playStartCallbacks.forEach((cb) => cb.callback());
    };

    // never added to the DOM, so no need to remove event listeners
    this.mediaSource.addEventListener("sourceopen", handleSourceopen);
    this.audioElement.addEventListener("timeupdate", handleTimeupdate);

    // ref: https://stackoverflow.com/questions/36803176/how-to-prevent-the-play-request-was-interrupted-by-a-call-to-pause-error

    this.onStopCallback = () => {
      try {
        this.mediaSource?.endOfStream();
        this.audioElement!.src = "";
      } catch (e) {}
    };
  }

  setRate(rate: number): void {
    this.audioElement!.playbackRate = rate;
    this.rate = rate;
  }

  stop(): void {
    this.onStopCallback?.();
  }

  pause(): void {
    this.queue = [];
    this.audioElement?.pause();
  }

  restart(): void {}

  resume(): void {
    if (this.audioElement?.paused) {
      this.audioElement.play();
    }

    this.audioElement!.play();
  }

  appendBuffer(value: Uint8Array, onPlayStart?: () => void): void {
    if (this.sourceBuffer && !this.sourceBuffer.updating) {
      this.onPlayStartCallbacks.push({ startTime: this.calculateTimestamp(), callback: onPlayStart ?? (() => {}) });
      this.sourceBuffer.appendBuffer(value);
    } else {
      this.queue?.push({ audio: value, callback: onPlayStart ?? (() => {}) });
    }
  }

  private onUpdateEnd(): void {
    if (this.queue!.length > 0) {
      const { audio, callback } = this.queue!.shift()!;
      this.onPlayStartCallbacks.push({ startTime: this.calculateTimestamp(), callback });
      this.sourceBuffer!.appendBuffer(audio);
    }
  }

  private calculateTimestamp(): number {
    if (this.sourceBuffer) {
      const buffered = this.sourceBuffer.buffered;
      if (buffered.length > 0) {
        return buffered.end(buffered.length - 1);
      }
    }
    return 0;
  }
}

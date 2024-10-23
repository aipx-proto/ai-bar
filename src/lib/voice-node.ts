import { catchError, EMPTY, filter, first, forkJoin, map, mergeMap, Observable, share, tap } from "rxjs";

export class VoiceNode extends HTMLElement {
  private mediaStream: Promise<MediaStream> = navigator.mediaDevices.getUserMedia({ audio: true });
  private recorder: MediaRecorder | null = null;

  public async startRecording() {
    this.recorder = new MediaRecorder(await this.mediaStream);
    const $audio = createAudioStream(this.recorder);
    const apiKey = this.getAttribute("data-api-key") ?? "";
    const $text = getTextStream($audio, apiKey);

    $text.subscribe((result) => this.dispatchEvent(new CustomEvent("transcriptiondone", { detail: result })));
  }

  public finishRecording() {
    this.recorder?.stop();
  }
}

export function defineVoiceNode(tagName = "voice-node") {
  customElements.define(tagName, VoiceNode);
}

/* INTERNAL */
interface TranscribeOptions {
  locale?: "en-US";
  profanityFilterMode?: "None" | "Masked" | "Removed" | "Tags";
  apiKey: string;
  region: string;
}

interface TranscribeResult {
  combinedPhrases: [
    {
      channel: number;
      text: string;
    }
  ];
  duration: number;
  phrases: [
    {
      channel: number;
      confidence: number;
      duration: number;
      locale: string;
      offset: number;
      text: string;
      words: [
        {
          text: string;
          offset: number;
          duration: number;
        }
      ];
    }
  ];
}

function createAudioStream(mediaRecorder: MediaRecorder): Observable<Blob> {
  const $audio = new Observable<Blob>((subscriber) => {
    mediaRecorder.onstart = (event) => console.log(`[audio] started`, event);
    mediaRecorder.onerror = (event) => console.error(`[audio] error`, event);

    mediaRecorder.ondataavailable = (event) => {
      console.log(`[audio] data available`, event.data);
      if (event.data.size === 0) return;
      subscriber.next(event.data);
    };
    mediaRecorder.onstop = () => {
      console.log(`[audio] stopped`);
      subscriber.complete();
    };
    mediaRecorder.start(500);

    return () => {
      mediaRecorder.stop();
    };
  });

  return $audio;
}

function getTextStream($audioStream: Observable<Blob>, apiKey: string): Observable<string> {
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  const definition = JSON.stringify({
    locales: ["en-US"],
    profanityFilterMode: "None",
    channels: [0, 1],
  });
  const formDataParts = [
    `--${boundary}\r\n`,
    'Content-Disposition: form-data; name="definition"\r\n',
    "Content-Type: application/json\r\n\r\n",
    definition + "\r\n",
    `--${boundary}\r\n`,
    'Content-Disposition: form-data; name="audio"; filename="audio.wav"\r\n',
    "Content-Type: audio/wav\r\n\r\n",
  ];

  let writer: ReadableStreamDefaultController;
  const audioStream = new ReadableStream({
    start(controller) {
      writer = controller;
    },
  });

  const bodyStream = new ReadableStream({
    async start(controller) {
      for (const part of formDataParts) {
        controller.enqueue(new TextEncoder().encode(part));
      }

      const reader = audioStream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(new Uint8Array(await value.arrayBuffer()));
      }

      controller.enqueue(new TextEncoder().encode(`\r\n--${boundary}--\r\n`));
      controller.close();
    },
  });

  const $transcriptionStream = $audioStream.pipe(share());

  const $handleAudio = $transcriptionStream.pipe(
    tap({
      next: (blob) => writer.enqueue(blob),
      complete: () => writer.close(),
    })
  );

  const $handleNetwork = $transcriptionStream.pipe(
    first(),
    mergeMap(() => {
      return fetch(`https://eastus.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-05-15-preview`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": "multipart/form-data; boundary=" + boundary,
        },
        // @ts-expect-error, ref: https://github.com/node-fetch/node-fetch/issues/1769
        duplex: "half",
        body: bodyStream,
      }).then((res) => res.json() as Promise<TranscribeResult>);
    }),
    map((response) => response.combinedPhrases.at(0)?.text),
    filter(Boolean),
    catchError((_error) => EMPTY)
  );

  const $combined = forkJoin({
    audio: $handleAudio,
    network: $handleNetwork,
  });

  return $combined.pipe(map(({ network }) => network));
}

import { attachShadowHtml } from "../wc-utils/attach-html";

export class ScreenCapture extends HTMLElement {
  private activeStream: MediaStream | null = null;
  private video!: HTMLVideoElement;
  private canvas!: HTMLCanvasElement;
  private context!: CanvasRenderingContext2D;

  constructor() {
    super();
    this.drawVideoFrame = this.drawVideoFrame.bind(this);
  }

  shadowRoot = attachShadowHtml(
    this,
    `
    <style>
    canvas,video {
      display: block;
      max-width: 200px;
    }

    video {
      visibility: hidden
    }
    </style>
    <button title="Capture Screen">📸</button>
    <video autoplay playsinline muted></video>
    <canvas></canvas>
  `
  );
  connectedCallback() {
    this.video = this.shadowRoot.querySelector("video")!;
    this.canvas = this.shadowRoot.querySelector("canvas")!;
    this.context = this.canvas.getContext("2d")!;

    this.setAttribute("provides", "toolbar-item");
    this.shadowRoot.querySelector("button")?.addEventListener("click", async () => {
      if (this.activeStream) {
        this.stop();
      } else {
        this.start();
      }
    });
  }

  private async start() {
    if (this.activeStream) return;
    this.activeStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: {
          ideal: 1,
          max: 1,
        },
      },
      audio: false,
    });

    this.video.srcObject = this.activeStream;
    console.log("connected to video");

    this.video.requestVideoFrameCallback(this.drawVideoFrame);
  }

  private drawVideoFrame() {
    if (!this.activeStream) return;
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    this.video.requestVideoFrameCallback(this.drawVideoFrame);
  }

  private stop() {
    this.activeStream?.getTracks()?.forEach((track) => track.stop());
    this.activeStream = null;
  }
}

export function defineScreenCapture(tagName = "screen-capture") {
  customElements.define(tagName, ScreenCapture);
}

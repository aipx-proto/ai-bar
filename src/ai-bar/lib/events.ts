export interface AIBarEventDetail {
  hide?: boolean;
  pttPressed?: boolean;
  pttReleased?: boolean;
  recognized?: Recognition;
  sentenceGenerated?: string;
  fullResponseGenerated?: string;
  textSubmitted?: string;
  dragged?: {
    deltaX: number;
    deltaY: number;
  };
}

export interface Recognition {
  text: string;
  isFinal: boolean;
}

export function emit(source: HTMLElement, data: AIBarEventDetail) {
  source.dispatchEvent(
    new CustomEvent<AIBarEventDetail>("event", {
      detail: data,
      bubbles: true,
    })
  );
}
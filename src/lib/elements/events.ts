export interface AIButtonEventData {
  pttPressed?: boolean;
  pttReleased?: boolean;
  recognized?: Recognition;
  generated?: string;
}

export interface Recognition {
  text: string;
  isFinal: boolean;
}

export function emit(source: HTMLElement, data: AIButtonEventData) {
  source.dispatchEvent(
    new CustomEvent<AIButtonEventData>("event", {
      detail: data,
      bubbles: true,
    })
  );
}

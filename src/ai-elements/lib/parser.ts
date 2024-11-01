import * as htmlparser2 from "htmlparser2";
import type { ChatCompletionChunk } from "openai/resources/index.mjs";

export async function* toTextStream(responseStream: AsyncIterable<ChatCompletionChunk>) {
  for await (const response of responseStream) {
    const delta = response.choices.at(0)?.delta?.content;
    if (delta) yield delta;
  }
}

export interface ParseHtmlStreamOptions {
  htmlStream: AsyncIterable<string>;
  tagName: string;
  onInnerHtmlDelta?: (html: string) => void;
}
export async function getTagInnerHtmlStream(options: ParseHtmlStreamOptions) {
  const { htmlStream, tagName, onInnerHtmlDelta } = options;

  let isInTag = false;
  const parser = new htmlparser2.Parser({
    onopentag: (name) => {
      if (name === tagName) {
        isInTag = true;
      }
    },
    ontext: (text) => {
      if (!isInTag) return;
      onInnerHtmlDelta?.(text);
    },
    onclosetag: (name) => {
      if (name === tagName) {
        isInTag = false;
      }
    },
  });

  for await (const text of htmlStream) {
    parser.write(text);
  }

  parser.end();
}

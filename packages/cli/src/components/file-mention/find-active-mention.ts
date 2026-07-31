export type MentionMatch = {
  start: number;
  end: number;
  query: string;
};

const ALLOWED_QUERY_CHARS = /[A-Za-z0-9._/\\-]/;

const isAllowedQueryChar = (value: string) => {
  return ALLOWED_QUERY_CHARS.test(value);
};

export const findActiveMention = (
  text: string,
  cursorOffset: number,
): MentionMatch | null => {
  let start = cursorOffset;
  while (start > 0 && !/\s/.test(text[start - 1]!)) {
    start--;
  }

  let end = cursorOffset;
  while (end < text.length && !/\s/.test(text[end]!)) {
    end++;
  }

  const token = text.slice(start, end);
  const relativeCursor = cursorOffset - start;
  const mentionStart = token.lastIndexOf("@", relativeCursor);

  if (mentionStart === -1) return null;

  const prevChar = token[mentionStart - 1];
  if (prevChar && isAllowedQueryChar(prevChar)) return null;

  let mentionEnd = mentionStart + 1;
  while (mentionEnd < token.length && isAllowedQueryChar(token[mentionEnd]!)) {
    mentionEnd++;
  }

  if (relativeCursor > mentionEnd) {
    return null;
  }

  return {
    start: mentionStart + start,
    end: start + mentionEnd,
    query: token.slice(mentionStart + 1, mentionEnd),
  };
};

/*
example 1:
text = "hello @world"
cursorOffset = 12

return {
  start: 6,
  end: 12,
  query: "world",
}

example 2:
text = "what is @src/main.ts about"
cursorOffset = 21

return {
  start: 8,
  end: 20,
  query: "src/main.ts",
}

example 3:
text = "what is@src/main.ts about"
cursorOffset = 20

return null

example 4:
text = "@src/main.ts,"
cursorOffset = 13

return null
*/

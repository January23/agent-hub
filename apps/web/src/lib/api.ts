export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:4000";
  return raw.replace(/\/$/, "");
}

export async function parseSseStream(
  stream: ReadableStream<Uint8Array> | null,
  onEvent: (event: string, data: unknown) => void,
): Promise<void> {
  if (!stream) return;
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    for (;;) {
      const sep = buffer.indexOf("\n\n");
      if (sep < 0) break;
      const chunk = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      let eventName = "message";
      let dataStr = "";
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        if (line.startsWith("data:")) dataStr += line.slice(5).trim();
      }
      try {
        onEvent(eventName, dataStr ? JSON.parse(dataStr) : null);
      } catch {
        onEvent(eventName, dataStr);
      }
    }
  }
}

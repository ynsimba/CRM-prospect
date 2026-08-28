export function encodeNotificationBody(text: string, href?: string) {
  return href ? `${href}\n${text}` : text;
}

export function decodeNotificationBody(body: string) {
  if (body.startsWith("/")) {
    const index = body.indexOf("\n");
    if (index > 0) {
      return { href: body.slice(0, index), text: body.slice(index + 1) };
    }
  }
  return { href: null as string | null, text: body };
}

export const HOT_SCORE = 81;

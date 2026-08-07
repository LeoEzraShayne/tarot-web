export async function onRequest(context) {
  const url = new URL(context.request.url);
  const response = await context.next();

  if (
    url.hostname !== "tarot.meritledger.org" ||
    !response.headers.get("Content-Type")?.includes("text/html")
  ) {
    return response;
  }

  const html = await response.text();
  const entryTag = html.match(
    /<script defer src="(\/assets\/index-[^"]+\.js)"><\/script>/,
  );

  if (!entryTag) return response;

  const entryResponse = await fetch(
    new URL(entryTag[1], "https://tarot-web-c5c.pages.dev"),
  );
  if (!entryResponse.ok) return response;

  const nonce = crypto.randomUUID().replaceAll("-", "");
  const entrySource = (await entryResponse.text()).replaceAll(
    "</script",
    "<\\/script",
  );
  const inlinedHtml = html
    .replace(entryTag[0], "")
    .replace(
      "</body>",
      `<script nonce="${nonce}">${entrySource}</script></body>`,
    );
  const headers = new Headers(response.headers);
  headers.set(
    "Content-Security-Policy",
    `script-src 'self' 'nonce-${nonce}' https://accounts.google.com https://static.cloudflareinsights.com`,
  );
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  headers.delete("Content-Length");
  headers.delete("ETag");

  return new Response(inlinedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

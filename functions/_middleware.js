export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === "tarot.meritledger.org") {
    url.hostname = "tarot-web-c5c.pages.dev";
    return Response.redirect(url.toString(), 302);
  }

  return context.next();
}

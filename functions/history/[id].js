export async function onRequestGet(context) {
  const appShellUrl = new URL(context.request.url);
  appShellUrl.pathname = "/index.html";
  appShellUrl.search = "";

  const response = await context.next(appShellUrl.toString());
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  return new Response(response.body, {
    status: 200,
    headers,
  });
}

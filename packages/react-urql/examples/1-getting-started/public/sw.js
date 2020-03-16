/* NOTE:
 * This demo is running a mock API in a service worker!
 * In this file you can find the service worker. It doesn't
 * execute GraphQL requests itself. Rather, it'll send them
 * back to the client-side, which creates the response.
 */

const channel = new BroadcastChannel("cs-graphql");

let count = 0;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", async event => {
  const { request } = event;
  if (!/\/graphql$/.test(request.url) || request.url.includes("node_modules")) {
    return;
  }

  const key = ++count;

  const response = new Promise(resolve => {
    const handler = ({ data }) => {
      if (data.key === key) {
        resolve({ data: data.data, errors: data.errors });
        channel.removeEventListener("message", handler);
      }
    };

    channel.addEventListener("message", handler);
  });

  return event.respondWith(
    (async () => {
      const { query, variables } = await (await request.clone()).json();
      channel.postMessage({ key, query, variables });
      const data = await response;
      return new Response(JSON.stringify(data, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    })()
  );
});


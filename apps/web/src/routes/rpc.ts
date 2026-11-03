import { createFileRoute } from "@tanstack/react-router";
import * as cf from "cloudflare:workers";

// Same-origin endpoint for the browser's RPC client. It forwards to the private API Worker
// over the service binding, so the API has no public URL and needs no CORS.
// `cf.env` is read per request: in dev it is not available when route modules load.
export const Route = createFileRoute("/rpc")({
  server: {
    handlers: {
      POST: ({ request }) => cf.env.API.fetch(request),
    },
  },
});

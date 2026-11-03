import * as Cloudflare from "@alchemy.run/cloudflare";
import Api from "@repo/api/Api";
import * as Alchemy from "alchemy";
import * as Effect from "effect/Effect";
import * as Path from "effect/Path";

// The TanStack Start app. `API` is a private service binding; the site's /rpc route forwards to it.
export class Website extends Cloudflare.Website.Vite<Website>()(
  "Website",
  Effect.gen(function* () {
    const path = yield* Path.Path;

    return {
      rootDir: path.resolve(import.meta.dirname, "apps/web"),
      compatibility: { flags: ["enable_request_signal"] },
      env: { API: Api },
      // Rebuild when the shared contracts change, not only the app itself.
      memo: { include: ["**/*", "../../packages/contracts/src/**"], lockfile: true },
    };
  }),
) {}

export type WebsiteEnv = Cloudflare.InferEnv<typeof Website>;

export default Alchemy.Stack(
  "App",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const website = yield* Website;

    return { url: website.url.as<string>() };
  }),
);

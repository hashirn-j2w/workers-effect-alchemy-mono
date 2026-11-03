// Types `env` from cloudflare:workers with the bindings declared on Website in alchemy.run.ts.
import type { WebsiteEnv } from "../../../alchemy.run.ts";

declare module "cloudflare:workers" {
  namespace Cloudflare {
    interface Env extends WebsiteEnv {}
  }
}

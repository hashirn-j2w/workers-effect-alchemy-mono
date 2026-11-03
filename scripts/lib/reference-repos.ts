// Read-only upstream sources that agents read instead of guessing at APIs.
// Each clone is pinned to the tag matching our catalog version.
export interface ReferenceRepo {
  readonly id: string;
  readonly repository: string;
  readonly catalogKey: string;
  readonly tagPrefix: string;
  // Sparse checkout paths. Omit to check out the whole repo.
  readonly paths?: ReadonlyArray<string>;
}

export const referenceRepos: ReadonlyArray<ReferenceRepo> = [
  {
    id: "effect-smol",
    repository: "https://github.com/Effect-TS/effect.git",
    catalogKey: "effect",
    tagPrefix: "effect@",
  },
  {
    id: "alchemy-effect",
    repository: "https://github.com/alchemy-run/alchemy-effect.git",
    catalogKey: "alchemy",
    tagPrefix: "v",
  },
  {
    id: "tanstack-router",
    repository: "https://github.com/TanStack/router.git",
    catalogKey: "@tanstack/react-start",
    tagPrefix: "@tanstack/react-start@",
    paths: [
      "docs/start",
      "docs/router",
      "packages/react-router",
      "packages/react-start",
      "packages/router-core",
      "packages/start-client-core",
      "packages/start-server-core",
      "examples/react/start-basic",
    ],
  },
];

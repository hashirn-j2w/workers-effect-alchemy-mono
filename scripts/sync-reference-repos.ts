#!/usr/bin/env node
// Shallow-clones each reference repo into .repos/<id> at the tag matching the catalog version.
// Clones already at the right tag are left alone, so rerunning is cheap.
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import * as Yaml from "yaml";

import { referenceRepos, type ReferenceRepo } from "./lib/reference-repos.ts";

export class GitCommandError extends Schema.TaggedError<GitCommandError>()("GitCommandError", {
  args: Schema.Array(Schema.String),
  exitCode: Schema.Number,
}) {
  override get message(): string {
    return `git ${this.args.join(" ")} exited with code ${this.exitCode}.`;
  }
}

export class CatalogVersionMissing extends Schema.TaggedError<CatalogVersionMissing>()(
  "CatalogVersionMissing",
  { repoId: Schema.String, catalogKey: Schema.String },
) {
  override get message(): string {
    return `pnpm-workspace.yaml has no catalog entry "${this.catalogKey}" for ${this.repoId}.`;
  }
}

const Workspace = Schema.Struct({ catalog: Schema.Record(Schema.String, Schema.String) });
const decodeWorkspace = Schema.decodeUnknownEffect(Workspace);

const git = Effect.fn("git")(function* (args: ReadonlyArray<string>, cwd: string) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  const exitCode = yield* spawner.exitCode(
    ChildProcess.make("git", args, { cwd, stdout: "inherit", stderr: "inherit" }),
  );

  if (exitCode !== 0) return yield* new GitCommandError({ args, exitCode });
});

const tagsAtHead = Effect.fn("tagsAtHead")(function* (dir: string) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  return yield* spawner
    .lines(ChildProcess.make("git", ["tag", "--points-at", "HEAD"], { cwd: dir }))
    .pipe(Effect.orElseSucceed((): Array<string> => []));
});

const syncRepo = Effect.fn("syncRepo")(function* (
  repo: ReferenceRepo,
  catalog: Readonly<Record<string, string>>,
  reposDir: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const version = catalog[repo.catalogKey];

  if (version === undefined) {
    return yield* new CatalogVersionMissing({ repoId: repo.id, catalogKey: repo.catalogKey });
  }

  const tag = `${repo.tagPrefix}${version}`;
  const dir = path.join(reposDir, repo.id);

  if ((yield* fs.exists(dir)) && (yield* tagsAtHead(dir)).includes(tag)) {
    yield* Console.log(`${repo.id} is at ${tag}.`);

    return;
  }

  yield* Console.log(`Cloning ${repo.id} at ${tag}.`);
  yield* fs.remove(dir, { recursive: true, force: true });
  const sparse = repo.paths === undefined ? [] : ["--filter=blob:none", "--sparse"];
  yield* git(
    [
      "-c",
      "advice.detachedHead=false",
      "clone",
      "--quiet",
      "--depth",
      "1",
      "--branch",
      tag,
      ...sparse,
      repo.repository,
      dir,
    ],
    reposDir,
  );

  if (repo.paths !== undefined) yield* git(["sparse-checkout", "set", ...repo.paths], dir);
});

const main = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  // The working directory, so worktree setup can sync into the main checkout.
  const rootDir = path.resolve();

  const workspace = yield* fs
    .readFileString(path.join(rootDir, "pnpm-workspace.yaml"))
    .pipe(Effect.flatMap((text) => decodeWorkspace(Yaml.parse(text))));

  const reposDir = path.join(rootDir, ".repos");
  yield* fs.makeDirectory(reposDir, { recursive: true });
  yield* Effect.forEach(referenceRepos, (repo) => syncRepo(repo, workspace.catalog, reposDir), {
    concurrency: "unbounded",
    discard: true,
  });
});

main.pipe(Effect.provide(NodeServices.layer), NodeRuntime.runMain);

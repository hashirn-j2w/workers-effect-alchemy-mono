// @effect-diagnostics nodeBuiltinImport:off - runs before `vp i`, so only Node built-ins exist.
// Prepares a T3 Code worktree: installs, then links .env and .repos from the main checkout.
import * as NodeChildProcess from "node:child_process";
import * as NodeFS from "node:fs";
import * as NodePath from "node:path";

const worktree = NodePath.dirname(import.meta.dirname);
const projectRoot = process.env.T3CODE_PROJECT_ROOT ?? "";

if (projectRoot === "") {
  throw new Error("T3CODE_PROJECT_ROOT is not set. Run this through the t3.json setup action.");
}

// T3 runs setup in the background. Agents wait while `setup-running` names a live PID,
// then read `setup-done` or `setup-failed` instead of racing their own `vp i`.
const markerDir = NodePath.join(worktree, ".t3");
const runningMarker = NodePath.join(markerDir, "setup-running");
const doneMarker = NodePath.join(markerDir, "setup-done");
const failedMarker = NodePath.join(markerDir, "setup-failed");

NodeFS.rmSync(doneMarker, { force: true });

NodeFS.rmSync(failedMarker, { force: true });

NodeFS.mkdirSync(markerDir, { recursive: true });

NodeFS.writeFileSync(runningMarker, `${process.pid}\n`);

let failureDetail = "";

process.on("uncaughtExceptionMonitor", (error) => {
  failureDetail = error.stack ?? String(error);
});

process.on("exit", (code) => {
  if (code === 0) NodeFS.writeFileSync(doneMarker, "");
  else NodeFS.writeFileSync(failedMarker, `Setup exited with code ${code}.\n${failureDetail}\n`);
  NodeFS.rmSync(runningMarker, { force: true });
});

// Echoes the command's output, and on failure exits with its tail in the failure marker.
function run(command: string, cwd: string) {
  const result = NodeChildProcess.spawnSync(command, {
    cwd,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });

  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);

  if (result.status !== 0) {
    failureDetail = `${command}\n${(result.stdout + result.stderr).trimEnd().split("\n").slice(-30).join("\n")}`;
    process.exit(result.status ?? 1);
  }
}

// Replaces only symlinks, so a real file or directory in the worktree always survives.
function linkFromMain(name: string) {
  const source = NodePath.join(projectRoot, name);
  const target = NodePath.join(worktree, name);
  const existing = NodeFS.lstatSync(target, { throwIfNoEntry: false });

  if (!NodeFS.existsSync(source)) return;

  if (existing && !existing.isSymbolicLink()) return;

  if (existing) NodeFS.rmSync(target);
  NodeFS.symlinkSync(source, target);
}

// A stale lockfile must fail, not be rewritten. pnpm needs --yes when stdin is closed.
run("vp i --frozen-lockfile -- --yes", worktree);

if (NodePath.resolve(projectRoot) !== worktree) {
  linkFromMain(".env");
  // One read-only set of reference clones serves every worktree.
  run(
    `node ${JSON.stringify(NodePath.join(worktree, "scripts", "sync-reference-repos.ts"))}`,
    projectRoot,
  );
  linkFromMain(".repos");
}

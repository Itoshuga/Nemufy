import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter } from "node:path";

const javaCandidates = [
  "/opt/homebrew/opt/openjdk@21/bin",
  "/usr/local/opt/openjdk@21/bin",
];
const javaPath = javaCandidates.find((candidate) =>
  existsSync(`${candidate}/java`),
);
const environment = {
  ...process.env,
  PATH: javaPath
    ? `${javaPath}${delimiter}${process.env.PATH ?? ""}`
    : process.env.PATH,
};

const pnpmExecutable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(
  pnpmExecutable,
  [
    "exec",
    "firebase",
    "emulators:exec",
    "--only",
    "firestore,storage",
    "pnpm exec tsx --test tests/firebase/*.test.ts",
  ],
  { cwd: process.cwd(), env: environment, stdio: "inherit" },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;

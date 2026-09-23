import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";

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

const firebaseCli = join(
  process.cwd(),
  "node_modules",
  "firebase-tools",
  "lib",
  "bin",
  "firebase.js",
);
const testCommand =
  process.platform === "win32"
    ? `"${process.execPath}" --import tsx --test tests/firebase/firestore.rules.test.ts tests/firebase/storage.rules.test.ts`
    : `${process.execPath} --import tsx --test tests/firebase/firestore.rules.test.ts tests/firebase/storage.rules.test.ts`;
const result = spawnSync(
  process.execPath,
  [firebaseCli, "emulators:exec", "--only", "firestore,storage", testCommand],
  { cwd: process.cwd(), env: environment, stdio: "inherit" },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;

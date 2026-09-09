import "dotenv/config";
import { createInterface, type Interface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createDatabase } from "../server/db.js";
import {
  createAdminAccount,
  formatAdminCreatedMessage,
  formatAdminPromotedMessage,
} from "../server/create-admin.js";

process.removeAllListeners("warning");
process.on("warning", (warning) => {
  if (warning.name === "ExperimentalWarning" && /sqlite/i.test(warning.message)) {
    return;
  }
  console.error(warning.stack || warning.message);
});

async function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    stdout.write(question);
    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";

    const cleanup = () => {
      stdin.off("data", onData);
      if (stdin.isTTY) {
        stdin.setRawMode(Boolean(wasRaw));
      }
    };

    const onData = (char: string) => {
      if (char === "\n" || char === "\r" || char === "\u0004") {
        cleanup();
        stdout.write("\n");
        resolve(value);
        return;
      }
      if (char === "\u0003") {
        cleanup();
        stdout.write("\n");
        reject(new Error("Cancelled."));
        return;
      }
      if (char === "\u0008" || char === "\u007f") {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    };

    stdin.on("data", onData);
  });
}

async function promptVisible(rl: Interface, question: string): Promise<string> {
  return (await rl.question(question)).trim();
}

console.log("Create a Client Admin account (server-side only).");
console.log("Enter the name, email and password for the admin account.\n");

const rl = createInterface({ input, output });
let name: string;
let email: string;
let password: string;
try {
  name = await promptVisible(rl, "Name: ");
  email = await promptVisible(rl, "Email: ");
  rl.pause();
  password = await promptHidden("Password: ");
} catch (error) {
  rl.close();
  const message = error instanceof Error ? error.message : "Unable to create the admin account.";
  console.error(message);
  process.exit(1);
}

let exitCode = 1;
const db = await createDatabase();
try {
  let result = await createAdminAccount(db, { name, email, password });

  if (result.status === "exists_member") {
    console.error("An account with this email already exists (role: member).");
    console.error("No duplicate account was created.");
    rl.resume();
    const answer = (await promptVisible(rl, "Promote this existing account to admin? (y/n): ")).toLowerCase();
    if (answer !== "y" && answer !== "yes") {
      console.error("No changes were made.");
    } else {
      result = await createAdminAccount(db, { name, email, password, promoteIfExists: true });
    }
  }

  if (result.status === "already_admin") {
    console.error("An account with this email already exists.");
    console.error(`Email: ${result.email}`);
    console.error("Role: admin");
    console.error("No duplicate account was created.");
  } else if (result.status === "created") {
    console.log(formatAdminCreatedMessage(result.email));
    exitCode = 0;
  } else if (result.status === "promoted") {
    console.log(formatAdminPromotedMessage(result.email));
    exitCode = 0;
  }
} catch (error) {
  const message = error instanceof Error ? error.message : "Unable to create the admin account.";
  console.error(message);
} finally {
  rl.close();
  await db.close();
}

process.exit(exitCode);

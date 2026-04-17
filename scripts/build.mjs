import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { spawn } from "node:child_process";

async function collectJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && extname(entry.name) === ".js") {
      files.push(fullPath);
    }
  }

  return files;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: true });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  const jsFiles = await collectJsFiles("src");

  if (jsFiles.length === 0) {
    throw new Error("No JavaScript source files found in src/");
  }

  console.log(`Checking syntax for ${jsFiles.length} file(s)...`);
  for (const file of jsFiles) {
    await run("node", ["--check", file]);
  }

  console.log("Generating Prisma client...");
  await run("npx", ["-y", "prisma@6.19.3", "generate"]);

  console.log("Build completed successfully.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

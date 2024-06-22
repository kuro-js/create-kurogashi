import { join, resolve } from "pathe";
import { readdirSync } from "fs-extra";
import { coloid } from "coloid";
import zip from "cross-zip";

const fromDir = resolve("templates");
const toDir = resolve("src", "templates");

const folders = readdirSync(fromDir).filter((f) => !f.startsWith("."));

for (const folder of folders) {
  coloid.info(`Copying ${folder}...`);

  zip.zipSync(join(fromDir, folder), join(toDir, folder + ".zip"));
}

coloid.success("Templates archived!");

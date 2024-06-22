import { defineBuildConfig } from "unbuild";
import { join, resolve } from "pathe";
import { coloid } from "coloid";
import { copySync } from "fs-extra";

export default defineBuildConfig({
  hooks: {
    "rollup:done": (ctx) => {
      const templatesDir = resolve("src", "templates");
      const distDir = resolve("dist", "templates");

      coloid.info(`Copying templates...`);

      copySync(templatesDir, distDir);
    },
  },
});

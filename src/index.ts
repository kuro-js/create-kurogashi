import { fileURLToPath } from "node:url";
import { BaseCommand, createCli, options } from "curzon";
import {
  detectPackageManager,
  installDependencies,
  type PackageManager,
} from "unnpm";
import { dirname, join, resolve } from "pathe";
import { $ } from "bun";
import { coloid } from "coloid";
import { existsSync, mkdirSync, rmdirSync, rmSync } from "fs-extra";
import { unzipSync } from "cross-zip";
import { name, version, description } from "../package.json";

export class InitCommand extends BaseCommand {
  static paths = ["init"];

  static meta = {
    name: "init",
    description: "Initialize a new Kurogashi project",
  };

  path = options.positional("path", {
    description: "Path to initialize the project",
    required: false,
  });

  type = options.string("type", {
    description: "Type of project to initialize <basic|module>",
    defaultValue: "basic",
    short: "t",
  });

  noInstall = options.boolean("no-install", {
    description: "Skip installing dependencies",
    defaultValue: false,
  });

  noGit = options.boolean("no-git", {
    description: "Skip initializing git repository",
    defaultValue: false,
  });

  packageManager = options.string("package-manager", {
    description: "Package manager to use <npm|yarn|pnpm|bun>",
    short: "p",
  });

  root = options.string("root", {
    description: "Root directory of the project",
    short: "r",
  });

  force = options.boolean("force", {
    description: "Force initialization",
    defaultValue: false,
    short: "f",
  });

  async run() {
    const cwd = resolve(this.root || process.cwd(), this.path || "");
    const logger = coloid.newTag("create-kurogashi");
    const install = !this.noInstall;
    const initializeGit = !this.noGit;

    if (!this.type) {
      logger.error("Project type is required");
      return;
    }

    if (!["basic", "module"].includes(this.type)) {
      logger.error(`Invalid project type: ${this.type}`);
      return;
    }

    if (existsSync(cwd) && !this.force) {
      logger.error(
        `Directory already exists. Use \`--force\` to clean all the files before.`,
      );
      return;
    }

    logger.info(`Initializing \`${this.type}\` project`);

    if (this.force) {
      rmSync(cwd, { recursive: true, force: true });
    }
    mkdirSync(cwd, { recursive: true });

    let packageManager: PackageManager;

    try {
      packageManager = (this.packageManager ||
        detectPackageManager()) as PackageManager;
    } catch {
      packageManager = "bun";
    }

    logger.info(`Using package manager: ${packageManager}`);

    const distDir = dirname(fileURLToPath(import.meta.url));
    const templatePath = join(distDir, "templates", this.type + ".zip");
    if (!existsSync(templatePath)) {
      logger.error(`Template for ${this.type} not found`);
      return;
    }

    unzipSync(templatePath, cwd);

    if (install) {
      try {
        await Promise.all([
          await installDependencies({
            packageManager: packageManager as PackageManager,
            cwd,
          }),
        ]);
      } catch (error) {
        logger.error("Failed to install dependencies");
        logger.error(error);
      }

      logger.success("Dependencies installed");
    }

    if (initializeGit) {
      logger.info("Initializing git repository");
      try {
        $`cd ${cwd} && git init`;
        logger.success("Git repository initialized");
      } catch (error) {
        logger.error("Failed to initialize git repository");
        logger.error(error);
      }
    }

    logger.success(`🐼 Project has been initialized for ${this.type}!`);

    logger.note(`To start the development server, run ${packageManager} dev`);
  }
}

const cli = createCli({
  appName: "Create Kurogashi",
  binaryName: name,
  description,
  version,
});

cli.run({
  rootCommand: InitCommand,
});

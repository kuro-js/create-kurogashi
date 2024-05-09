import { execSync } from "node:child_process";
import { group, confirm, note, text, select, spinner } from "@clack/prompts";
import { resolve, dirname } from "pathe";
import { existsSync, mkdirSync, writeFileSync } from "fs-extra";
import chalk from "chalk";

note(
  "Welcome to Kurogashi! \nThis command will help you initialize a new Kurogashi project.",
);

const options = await group({
  name: () =>
    text({
      message: "Project name",
      placeholder: "project-name",
      defaultValue: "project-name",
    }),
  typescript: () =>
    confirm({
      message: "Do you want to use typescript?",
    }),
  git: () =>
    confirm({
      message: "Initialize a git repository?",
    }),
  install: () => confirm({ message: "Install dependencies?" }),
});

const pm = await select({
  message: "Choose a package manager",
  options: [
    { value: "npm", label: "npm" },
    { value: "yarn", label: "yarn" },
    { value: "pnpm", label: "pnpm" },
    { value: "bun", label: "bun" },
  ],
});

const packageJson = {
  name: options.name,
  scripts: {
    dev: "bun --bun kurogashi dev",
    build: "bun --bun kurogashi build",
  },
  dependencies: {
    kurogashi: "latest",
  },
  devDependencies: {
    "@types/bun": "latest",
  },
};
const tsConfig = {
  compilerOptions: {
    lib: ["ESNext", "DOM", "DOM.Iterable"],
    target: "ESNext",
    module: "ESNext",
    moduleDetection: "force",
    allowJs: true,
    moduleResolution: "bundler",
    verbatimModuleSyntax: true,
    strict: true,
    skipLibCheck: true,
    noFallthroughCasesInSwitch: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noPropertyAccessFromIndexSignature: false,
  },
};

const path = resolve(options.name);

if (existsSync(path)) {
  console.log(chalk.red(`The directory ${chalk.gray(path)} already exists.`));
  process.exit(1);
} else {
  mkdirSync(path, {
    recursive: true,
  });
}

const s = spinner();

s.start("Creating project files");

const files = [
  { path: "package.json", content: JSON.stringify(packageJson, null, 2) },
  {
    path: `src/routes/hello.${options.typescript ? "ts" : "js"}`,
    content: `import { defineEvent, getHeaders } from "kurogashi"; \n\nexport default defineEvent((event) => {\n  return getHeaders(event)\n});`,
  },
  {
    path: `kurogashi.config.${options.typescript ? "ts" : "js"}`,
    content: `import { defineConfig } from "kurogashi"; \n\nexport default defineConfig({});`,
  },
];

if (options.typescript) {
  packageJson.devDependencies["typescript"] = "latest";
  files.push({
    path: "tsconfig.json",
    content: JSON.stringify(tsConfig, null, 2),
  });
}

if (options.git) {
  execSync("git init", { cwd: path });

  files.push({ path: ".gitignore", content: "node_modules\ndist\n.idea" });
}

for (const file of files) {
  const filePath = resolve(path, file.path);
  const parentDir = dirname(filePath);

  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }

  if (file.content) {
    writeFileSync(filePath, file.content);
  } else {
    mkdirSync(filePath, { recursive: true });
  }
}

if (options.install) {
  execSync(`${pm} install`, { cwd: path });
}

s.stop("🎉 Project created");

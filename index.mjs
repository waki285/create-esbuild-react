#!/usr/bin/env node
import enquirer from "enquirer";
import ora from "ora";
import { promises as fs, existsSync } from "node:fs";
import { join } from "node:path";
import childProcess from "node:child_process";
const { prompt } = enquirer;

let spinner;

const main = async () => {
  const PWD = join(import.meta.url.replace(/^file:\/\/\/?/, ""), "..");
//  console.log(PWD);
  const { typescript, eslint, prettier, git, packageManager } = await prompt([
    {
      type: "confirm",
      name: "typescript",
      message: "Do you want to use typescript?",
      initial: true,
    },
    {
      type: "confirm",
      name: "eslint",
      message: "Do you want to use eslint?",
      initial: true,
    },
    {
      type: "confirm",
      name: "prettier",
      message: "Do you want to use prettier?",
      initial: true,
    },
    {
      type: "confirm",
      name: "git",
      message: "Do you want to use git?",
      initial: true,
    },
    {
      type: "select",
      name: "packageManager",
      message: "Which package manager do you want to use?",
      choices: ["npm", "yarn"],
      initial: 0,
    }
  ]);
  const folderName = process.argv[2] || (await prompt({
    type: "input",
    name: "folderName",
    message: "What is the name of the folder?",
    initial: "my-project",
  })).folderName;
  spinner = ora("Creating project").start();
  if (existsSync(folderName)) {
    spinner.fail("Folder already exists");
    return;
  }

  const PATH = join(process.cwd(), folderName);
  await fs.mkdir(PATH);
  const packageJson = {
    name: folderName.toLowerCase().replace(/ /g, "-"),
    version: "1.0.0",
    description: "My React App",
    main: `src/js/client.${typescript ? "tsx" : "jsx"}`,
    scripts: {
      build: "node build-prod.js",
      clean: "rimraf dist",
      prebuild: `${packageManager === "yarn" ? "yarn" : "npm run"} clean`,
      predev: `${packageManager === "yarn" ? "yarn" : "npm run"} clean`,
      dev: "node build-dev.js",
    },
    keywords: [],
    dependencies: {},
    devDependencies: {
      "@types/node": "^18.11.18",
      "@types/react": "^18.0.27",
      "@types/react-dom": "^18.0.10",
      "esbuild": "^0.17.4",
      "esbuild-plugin-copy": "^2.0.2",
      "esbuild-sass-plugin": "^2.4.5",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-device-detect": "^2.2.2",
      "rimraf": "^4.1.2"
    },
  }
  await fs.writeFile(join(PATH, "package.json"), JSON.stringify(packageJson, null, 2));
  await fs.cp(join(PWD, "static"), PATH, { recursive: true });
  await fs.mkdir(join(PATH, "src", "js"));
  if (typescript) {
//    await fs.cp(join(PWD, "static-ts", "tsconfig.json"), join(PATH, "tsconfig.json"));
    await fs.cp(join(PWD, "static-ts"), PATH, { recursive: true });
  } else {
    await fs.cp(join(PWD, "static-js"), PATH, { recursive: true });
  }
  if (eslint) {
    const eslintRC = {
      "env": {
        "browser": true,
        "es2021": true
      },
      "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
      ],
      "overrides": [
      ],
      "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
      },
      "plugins": [
        "react"
      ],
      "rules": {
      }
    }
    if (typescript) {
      eslintRC.extends.push("plugin:@typescript-eslint/recommended");
      eslintRC.parser = "@typescript-eslint/parser";
      eslintRC.plugins.push("@typescript-eslint");
    }
    await fs.writeFile(join(PATH, ".eslintrc.json"), JSON.stringify(eslintRC, null, 2));
  }
  if (prettier) {
    const prettierRC = {
      "tabWidth": 2,
      "semi": true,
      "singleQuote": true,
      "printWidth": 80,
      "endOfLine": "lf"
    }
    await fs.writeFile(join(PATH, ".prettierrc"), JSON.stringify(prettierRC, null, 2));
  }
  if (git) {
    await fs.cp(join(PWD, "static-git"), PATH, { recursive: true });
  }
  spinner.succeed("Project created");
  if (git) {
    spinner = ora("Initializing git").start();
    childProcess.execSync("git init", { cwd: PATH, stdio: "ignore" });
    spinner.succeed("Git initialized");
  }
  spinner = ora("Installing dependencies").start();
  const command = packageManager === "yarn" ? `yarn${process.platform === "win32" ? ".cmd":""}` : `npm${process.platform === "win32" ? ".cmd":""}`
  const sp = childProcess.spawn(command, ["install"], { cwd: PATH });
  sp.on("close", (code) => {
    if (code === 0) {
      spinner.succeed("Dependencies installed");
      spinner = ora("Building project").start();
      spinner.succeed("Project built! You can now run 'npm run dev' or 'yarn dev' to start the development server");
        } else {
      spinner.fail("Failed to install dependencies");
    }
  });
};

main().catch((err) => {
  console.log(err);
  if (spinner) {
    spinner.fail("Process interrupted");
  }
  process.exit(1);
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    if (spinner) {
      spinner.fail("Process interrupted");
    }
    process.exit(1);
  });
});
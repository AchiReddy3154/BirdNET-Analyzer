import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const isWindows = process.platform === "win32";
const nodeExec = process.execPath;
const npmExecPath = process.env.npm_execpath;
const hasPackageManagerExec = typeof npmExecPath === "string" && npmExecPath.length > 0;
const pythonExe = existsSync(path.join(root, ".venv", "Scripts", "python.exe"))
  ? path.join(root, ".venv", "Scripts", "python.exe")
  : "python";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/birdnet";
const DATABASE_URL = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

function runOrExit(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: process.env,
    ...options,
  });

  if (result.error) {
    console.error(`[setup] Failed to run ${command}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runPnpmOrExit(args, options = {}) {
  if (hasPackageManagerExec) {
    runOrExit(nodeExec, [npmExecPath, ...args], options);
    return;
  }

  runOrExit("pnpm", args, options);
}

function log(prefix, message) {
  process.stdout.write(`[${prefix}] ${message}\n`);
}

function attachLogs(child, prefix) {
  child.stdout?.on("data", (chunk) => {
    const lines = chunk.toString().split(/\r?\n/);
    for (const line of lines) {
      if (line.trim().length > 0) {
        log(prefix, line);
      }
    }
  });

  child.stderr?.on("data", (chunk) => {
    const lines = chunk.toString().split(/\r?\n/);
    for (const line of lines) {
      if (line.trim().length > 0) {
        log(prefix, line);
      }
    }
  });
}

function spawnService(prefix, command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: root,
    shell: false,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  attachLogs(child, prefix);

  child.on("exit", (code, signal) => {
    const detail = signal ? `signal ${signal}` : `code ${code}`;
    log(prefix, `stopped (${detail})`);
  });

  return child;
}

function spawnPnpmService(prefix, args, env = {}) {
  if (hasPackageManagerExec) {
    return spawnService(prefix, nodeExec, [npmExecPath, ...args], env);
  }

  return spawnService(prefix, "pnpm", args, env);
}

function cleanupPorts() {
  if (!isWindows) {
    return;
  }

  spawnSync("powershell", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    "Get-NetTCPConnection -LocalPort 8000,8081,5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }",
  ], {
    cwd: root,
    stdio: "ignore",
    shell: false,
    env: process.env,
  });
}

cleanupPorts();

log("setup", "Building API server bundle...");
runPnpmOrExit(["--filter", "@workspace/api-server", "run", "build"]);

log("setup", "Starting services...");
log("setup", "Frontend: http://localhost:5173");
log("setup", "Node API: http://localhost:8081/api/healthz");
log("setup", "BirdNET API: http://localhost:8000/healthz");

const processes = [
  spawnService("py", pythonExe, ["birdnet-api/app.py"], { PORT: "8000" }),
  spawnPnpmService(
    "api",
    ["--filter", "@workspace/api-server", "exec", "node", "--enable-source-maps", "./dist/index.mjs"],
    {
      PORT: "8081",
      NODE_ENV: "development",
      DATABASE_URL,
    },
  ),
  spawnPnpmService(
    "web",
    ["--filter", "@workspace/birdnet-app", "run", "dev"],
    {
      PORT: "5173",
      BASE_PATH: "/",
      API_PROXY_TARGET: "http://127.0.0.1:8081",
    },
  ),
];

function shutdown() {
  log("setup", "Shutting down services...");
  for (const child of processes) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

for (const child of processes) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      log("setup", "A service exited unexpectedly. Stopping the rest.");
      shutdown();
      process.exit(code);
    }
  });
}

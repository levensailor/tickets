import pino from "pino";

const EST_TIMEZONE = "America/New_York";

function formatEstTimestamp(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Structured logger for Vercel/serverless.
 * Emits EST timestamps, function name, and line number to console.
 * File rotation is not used on serverless (logs are captured by the platform).
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: undefined,
  timestamp: false,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  mixin(_context, level, loggerInstance) {
    const err = new Error();
    const stackLines = (err.stack || "").split("\n");
    // stack[0]=Error, [1]=mixin, [2]=pino internals — find first app frame
    const appFrame =
      stackLines.find(
        (line) =>
          line.includes("/src/") &&
          !line.includes("node_modules") &&
          !line.includes("logger.ts")
      ) || stackLines[3] || "";
    const match = appFrame.match(/at\s+(?:async\s+)?([^\s(]+)?\s*\(?([^:]+):(\d+):(\d+)/);
    const functionName = match?.[1] || "anonymous";
    const lineNumber = match?.[3] || "?";
    return {
      timestampEst: formatEstTimestamp(),
      functionName,
      lineNumber,
      levelLabel: loggerInstance.levels.labels[level],
    };
  },
});

export function createLogger(scope: string) {
  return logger.child({ scope });
}

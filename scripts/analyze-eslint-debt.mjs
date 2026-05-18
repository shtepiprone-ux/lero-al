#!/usr/bin/env node
/**
 * analyze-eslint-debt.mjs
 *
 * Runs `npm run lint` and groups errors/warnings by rule name and file origin.
 * Read-only. Does not modify any files.
 *
 * Usage:
 *   node scripts/analyze-eslint-debt.mjs
 */

import { execSync } from "child_process";

function run() {
  let output = "";
  try {
    output = execSync("npm run lint 2>&1", { encoding: "utf-8", stdio: "pipe" });
  } catch (e) {
    output = e.stdout || e.message;
  }

  const lines = output.split("\n");
  const errorLines = lines.filter((l) => l.includes(" error "));
  const warningLines = lines.filter((l) => l.includes(" warning "));

  const summary = lines.find((l) => l.includes("problems (")) || "";
  const summaryMatch = summary.match(/(\d+) errors?,\s*(\d+) warnings?/);
  const totalErrors = summaryMatch ? parseInt(summaryMatch[1], 10) : 0;
  const totalWarnings = summaryMatch ? parseInt(summaryMatch[2], 10) : 0;

  // Group errors by rule
  const errorsByRule = {};
  for (const line of errorLines) {
    const ruleMatch = line.match(/(\S+\/\S+|\S+rule\S*)\s*$/);
    const rule = ruleMatch ? ruleMatch[1] : "(unknown)";
    errorsByRule[rule] = (errorsByRule[rule] || 0) + 1;
  }

  // Classify by file origin
  let currentFile = "";
  const errorsByOrigin = { src: 0, storybookStatic: 0, other: 0 };
  for (const line of lines) {
    if (
      line.startsWith("D:") ||
      line.startsWith("C:") ||
      line.startsWith("/") ||
      line.match(/^[A-Za-z]:\\/)
    ) {
      currentFile = line.trim();
    } else if (line.includes(" error ")) {
      if (currentFile.includes("storybook-static")) {
        errorsByOrigin.storybookStatic++;
      } else if (currentFile.includes(`${process.sep}src${process.sep}`) || currentFile.includes("/src/")) {
        errorsByOrigin.src++;
      } else {
        errorsByOrigin.other++;
      }
    }
  }

  console.log("=".repeat(60));
  console.log("ESLint Debt Analysis");
  console.log("=".repeat(60));
  console.log(`Total errors:   ${totalErrors}`);
  console.log(`Total warnings: ${totalWarnings}`);
  console.log();

  console.log("Errors by origin:");
  console.log(`  storybook-static/: ${errorsByOrigin.storybookStatic}`);
  console.log(`  src/:              ${errorsByOrigin.src}`);
  console.log(`  other:             ${errorsByOrigin.other}`);
  console.log();

  console.log("Errors by rule (sorted by count):");
  const sorted = Object.entries(errorsByRule).sort((a, b) => b[1] - a[1]);
  for (const [rule, count] of sorted) {
    console.log(`  ${String(count).padStart(4)}  ${rule}`);
  }
  console.log();

  if (errorsByOrigin.storybookStatic > 0) {
    console.log(
      "NOTE: All errors in storybook-static/ are false positives from\n" +
        "      minified build artifacts. Fix: add storybook-static/** to\n" +
        "      globalIgnores in eslint.config.mjs (Batch 1 of burn-down plan).\n" +
        "      See: docs/eslint-debt-taxonomy.md"
    );
  }
}

run();

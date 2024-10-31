import * as core from '@actions/core';
import child_process from 'child_process';

const MAX_BUFFER = 10 * 1024 * 1024;

/**
 * Executes command and returns STDOUT. If the command fails (non-zero), throws an error.
 */
export const execCapture = (command: string, options: { cwd?: string } = {}) => {
  core.debug(command);
  return child_process.execSync(command, {
    stdio: ["inherit", "pipe", "pipe"], // "pipe" for STDERR means it appears in exceptions
    maxBuffer: MAX_BUFFER,
    cwd: options.cwd,
  });
};

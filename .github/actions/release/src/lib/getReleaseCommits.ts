import * as core from '@actions/core';
import { execCapture } from './execCapture.js';

const commitMessage = 'chore(bump-version): bump package versions';

const getVersionFromCommit = (commit: string) => {
  const command = `git show ${commit}:package.json`;
  const result = execCapture(command).toString();
  return JSON.parse(result).version;
};

type Commit = { sha: string, message: string }

export const getReleaseCommits = (): [Commit, Commit, string] => {
  const command = `git log --grep '^${commitMessage}' --pretty=format:'{ "sha": "%H", "message": "%s" }' --no-patch -2`
  const result = execCapture(command)
    .toString()
    .split('\n')
    .filter((line) => typeof line === 'string' && line.length > 0)
  
  if (result.length !== 2) {
    throw new Error(`Could not find release commits, got: ${result}`);
  }

  const [to, from] = result.map(line => JSON.parse(line) as Commit);
  if (!from || !to) {
    throw new Error(`Could not find release commits from:(${from}) to:(${to})`);
  }

  const newVersion = getVersionFromCommit(to.sha);

  core.info(`Found commits from ${from.sha} to ${to.sha} with version ${newVersion}`);
  return [from, to, newVersion];
}

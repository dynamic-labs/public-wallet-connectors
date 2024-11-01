import * as core from '@actions/core';
import { execCapture } from './execCapture.js';

const commitMessage = 'chore(bump-version): bump package versions';

export const getReleaseCommits = () => {
  const command = `git log --grep '^${commitMessage}' --pretty=format:'{ "sha": "%H", "message": "%s" }' --no-patch -2`
  const result = execCapture(command);
  const [to, from] = result.toString().split('\n').map(line => JSON.parse(line));
  core.info(`Found commits from ${from.sha} to ${to.sha}`);
  return [from, to];
}

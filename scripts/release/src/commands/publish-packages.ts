import { releaseChangelog, releasePublish } from "nx/release";
import yargs from "yargs";
import * as core from '@actions/core';
import { hideBin } from "yargs/helpers";
import { execCapture } from '../lib/execCapture.js';


const commitMessage = 'chore(bump-version): bump package versions';

const getVersionFromCommit = (commit: string) => {
  const command = `git show ${commit}:package.json`;
  const result = execCapture(command).toString();
  return JSON.parse(result).version;
};

export const getReleaseCommits = () => {
  const command = `git log --grep '^${commitMessage}$' --pretty=format:'{ "sha": "%H", "message": "%s" }' --no-patch -2`
  const result = execCapture(command)
    .toString()
    .split('\n')
    .filter((line) => typeof line === 'string' && line.length > 0)
  
  if (result.length !== 2) {
    throw new Error(`Could not find release commits, got: ${result}`);
  }

  const [to, from] = result.map(line => JSON.parse(line));
  if (!from || !to) {
    throw new Error(`Could not find release commits from:(${from}) to:(${to})`);
  }

  const newVersion = getVersionFromCommit(to.sha);

  core.info(`Found commits from ${from.sha} to ${to.sha} with version ${newVersion}`);
  return [from, to, newVersion];
}


const publishPackages = async () => {
  const options = await yargs(hideBin(process.argv))
    .version(false) // don't use the default meaning of version in yargs
    .option('dryRun', {
      alias: 'd',
      description:
        'Whether or not to perform a dry-run of the release process, defaults to true',
      type: 'boolean',
      default: true,
    })
    .option('verbose', {
      description:
        'Whether or not to enable verbose logging, defaults to false',
      type: 'boolean',
      default: false,
    })
    .options('createRelease', {
      description: 'Whether or not to create a release on GitHub',
      type: 'boolean',
      default: false,
    })
    .parseAsync();

  const [from, to, workspaceVersion] = getReleaseCommits();

  // Updates the changelog according to conventional commits
  // Also will create github release with changelog
  const { workspaceChangelog } = await releaseChangelog({
    version: workspaceVersion,
    to: to.sha,
    from: from.sha,
    dryRun: options.dryRun,
    createRelease: options.createRelease ? 'github' : undefined,
    verbose: options.verbose,
  });

  await releasePublish({});

  console.log('Workspace changelog:', workspaceChangelog);
  
};

if (require.main === module) {
  publishPackages().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

import yargs from "yargs";
import * as core from '@actions/core';
import { hideBin } from "yargs/helpers";
import { Octokit } from "@octokit/action";
import { execCapture } from '../lib/execCapture.js';
import { detectTag } from "../lib/detectTag.js";
import { releaseChangelog, releasePublish } from "nx/release/index.js";
import { NxReleaseChangelogResult } from "nx/src/command-line/release/changelog.js";

const commitMessage = 'chore(bump-version): bump package versions';
const NX_ROOT = '/home/runner/work/sdk/sdk'


const getVersionFromCommit = (commit: string) => {
  const command = `git show ${commit}:package.json`;
  const result = execCapture(command).toString();
  return JSON.parse(result).version;
};

export const getReleaseCommits = () => {
  const command = `git log --grep '^${commitMessage}' --pretty=format:'{ "sha": "%H", "message": "%s" }' --no-patch -2`
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

const createRelease = async (
  target_commitish: string,
  changlog: NxReleaseChangelogResult['workspaceChangelog'],
  isLatest = false,
  dryRun = true
) => {
  core.startGroup('Create Release');

  const oktokit = new Octokit();
  const gitTag = changlog?.releaseVersion.gitTag;
  const changelogBody = changlog?.contents;
  const isPrerelease = changlog?.releaseVersion.isPrerelease;

  if (!gitTag) {
    throw new Error('gitTag is required to create a release');
  }

  if (!target_commitish) {
    throw new Error('target_commitish is required to create a release');
  }

  core.info(`Creating release for tag: ${gitTag}`);
  core.info(`Target commitish: ${target_commitish}`);
  core.info(`Is latest: ${isLatest}`);
  core.info(`Is prerelease: ${isPrerelease}`);

  if (!dryRun) {
    await oktokit.rest.repos.createRelease({
      owner: 'dynamic-labs',
      repo: 'sdk',
      tag_name: gitTag,
      target_commitish,
      name: gitTag,
      prerelease: isPrerelease,
      body: changelogBody,
      make_latest: isLatest ? 'true' : 'false',
    })
  }

  core.endGroup();
};

const publishPackages = async () => {

  if (process.env.GITHUB_ACTION) {
    core.info(`Changing directory to ${NX_ROOT}`);
    process.chdir(NX_ROOT);
  }

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
    gitCommit: false,
    gitTag: false,
    stageChanges: false,
    createRelease: false,
    verbose: options.verbose,
  });

  // Detect tag to use for publishing
  // Using @dynamic-labs-connector/safe-evm as the package name for determining the latest version
  const distTag = await detectTag('@dynamic-labs-connectors/safe-evm', workspaceVersion);

  if (options.createRelease) {
    if (!workspaceChangelog) {
      throw new Error('Missing changelog');
    }
    await createRelease(to.sha, workspaceChangelog, distTag === 'latest', options.dryRun);
  }

  const results = await releasePublish({
    dryRun: options.dryRun,
    tag: distTag,
  }); 

  if (Object.entries(results).some(([_, value]) => value.code !== 0)) {
    core.setFailed('Failed to publish packages');
  } else {
    core.summary.addDetails('Published', `Published packages with dist-tag: ${distTag}, version: ${workspaceVersion}`);
    core.summary.addEOL();
  }
};

publishPackages().then(() => {
  process.exit(0);
});


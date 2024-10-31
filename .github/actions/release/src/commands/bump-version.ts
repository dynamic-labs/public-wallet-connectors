import { releaseVersion } from 'nx/release'
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import * as core from '@actions/core';
import semver from 'semver';
import fs from 'fs';

const NX_ROOT = '/home/runner/work/sdk/sdk'

const writeRootVersion = async (version: string, dryRun = true) => {
  const rootPackage = await import(NX_ROOT + '/package.json');
  rootPackage.default.version = version;

  if (dryRun) {
    core.info(`[DRYRUN] Writing version ${version} to root package.json`);
    core.info(JSON.stringify(rootPackage.default, null, 2));
    return;
  }
  
  await fs.promises.writeFile(NX_ROOT + '/package.json', JSON.stringify(rootPackage.default, null, 2));
}

const bumpVersion = async () => {
  if (process.env.GITHUB_ACTION) {
    core.info(`Changing directory to ${NX_ROOT}`);
    process.chdir(NX_ROOT);
  }

  const options = await yargs(hideBin(process.argv))
    .version(false) // don't use the default meaning of version in yargs
    .option('version', {
      description:
        'Explicit version specifier to use',
      type: 'string',
      choices: ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'],
    })
    .option('preId', {
      description: 'The identifier for prerelease versions, defaults to "alpha"',
      type: 'string',
      default: 'alpha',
    })
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
    .parseAsync();

  /**
   * Additional configs for bumping version and changelog can be found in nx.json
   */

  // Bumps the version to disk
  const { workspaceVersion } = await releaseVersion({
    specifier: options.version,
    preid: options.preId,
    dryRun: options.dryRun,
    verbose: options.verbose,
    gitCommit: false,
    gitTag: false,
    stageChanges: false,
  });

  if (!workspaceVersion) {
    throw new Error('When generating a new version, the workspace version must be defined');
  }
  
  core.setOutput('major', semver.major(workspaceVersion));
  core.setOutput('minor', semver.minor(workspaceVersion));
  core.setOutput('patch', semver.patch(workspaceVersion));
  core.setOutput('prerelease', semver.prerelease(workspaceVersion)?.[0]);
  core.setOutput('version', workspaceVersion);

  await writeRootVersion(workspaceVersion, options.dryRun);
  return;
};



bumpVersion().then(() => {
  process.exit(0);
});


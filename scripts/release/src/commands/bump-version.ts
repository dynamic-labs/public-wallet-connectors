import { releaseVersion } from 'nx/release'
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import * as core from '@actions/core';
import semver from 'semver';
import { writeDistTag } from '../lib/writeDistTag.js';
import fs from 'fs';

const writeRootVersion = async (version: string, dryRun = true) => {
  if (dryRun) {
    console.log(`[DRYRUN] Writing version ${version} to root package.json`);
    return;
  }
  const rootPackage = await import(process.env.NX_WORKSPACE_ROOT + '/package.json');
  rootPackage.version = version;
  await fs.promises.writeFile(process.env.NX_WORKSPACE_ROOT + '/package.json', JSON.stringify(rootPackage, null, 2));
}

const bumpVersion = async () => {
  const options = await yargs(hideBin(process.argv))
    .version(false) // don't use the default meaning of version in yargs
    .option('version', {
      description:
        'Explicit version specifier to use',
      type: 'string',
      choices: ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch'],
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
  const { workspaceVersion, projectsVersionData} = await releaseVersion({
    specifier: options.version,
    preid: options.preId,
    dryRun: options.dryRun,
    verbose: options.verbose,
  });

  if (!workspaceVersion) {
    throw new Error('When generating a new version, the workspace version must be defined');
  }
  
  core.setOutput('major', semver.major(workspaceVersion));
  core.setOutput('minor', semver.minor(workspaceVersion));
  core.setOutput('patch', semver.patch(workspaceVersion));
  core.setOutput('prerelease', semver.prerelease(workspaceVersion)?.[0]);
  core.setOutput('version', workspaceVersion);

  await writeDistTag(projectsVersionData, options.dryRun);
  await writeRootVersion(workspaceVersion, options.dryRun);
};

export default bumpVersion;

if (require.main === module) {
  bumpVersion().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

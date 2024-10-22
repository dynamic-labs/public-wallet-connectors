import { releaseVersion, releaseChangelog } from 'nx/release'
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const bumpVersion = async () => {
  const options = await yargs(hideBin(process.argv))
    .version(false) // don't use the default meaning of version in yargs
    .option('version', {
      description:
        'Explicit version specifier to use, if overriding conventional commits',
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

  const { workspaceVersion, projectsVersionData} = await releaseVersion({
    specifier: options.version,
    preid: options.preId,
    dryRun: options.dryRun,
    verbose: options.verbose,
  });

  await releaseChangelog({
    versionData: projectsVersionData,
    version: workspaceVersion,
    dryRun: options.dryRun,
    verbose: options.verbose,
  });
};

export default bumpVersion;

if (require.main === module) {
  bumpVersion().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

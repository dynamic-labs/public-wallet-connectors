import semver from 'semver';
import * as core from '@actions/core';


const semverSort = (a: string, b: string) => {
  const aSemver = semver.parse(a);
  const bSemver = semver.parse(b);
  if (!aSemver || !bSemver) {
    return 0;
  }
  return semver.compare(aSemver, bSemver);
};

const fetchCache: Record<string, string[]> = {};

const fetchPublishedVersions = async (packageName: string): Promise<string[]> => {
  if (fetchCache[packageName]) {
    return fetchCache[packageName];
  }

  const res = await fetch(`https://registry.npmjs.org/${packageName}`);
  const json = await res.json();
  const versions = Object.keys(json.versions);
  
  /**
  * A list of published versions sorted and filtered to exclude prereleases
  */
  const filterPrereleases = versions.filter(v => !semver.prerelease(v));

  const result = filterPrereleases.length ? filterPrereleases.sort(semverSort) : versions.sort(semverSort);

  if (result.length === 0) {
    throw new Error(`No remote versions found for ${packageName} at https://registry.npmjs.org/${packageName}`);
  }

  fetchCache[packageName] = result;
  return result;
};


const getLatestVersion = async (packageName: string, version: string): Promise<[string, boolean]> => {
  const versions = await fetchPublishedVersions(packageName);
  const latestVersion = versions.sort(semverSort).at(-1)
  if (!latestVersion) {
    throw new Error('No remote versions found [latest]');
  }
  return [latestVersion, semver.gt(version, latestVersion)];
}

const getLatestMinorVersion = async (packageName: string, version: string) => {
  const versions = await fetchPublishedVersions(packageName);
  const major = semver.major(version);

  const filtered = versions.filter(version => semver.major(version) === major)
  const lastVersion = filtered.sort(semverSort).at(-1);
  if (!lastVersion) {
    throw new Error('No remote versions found [minor]');
  }
  return [lastVersion, semver.gt(version, lastVersion)];
}

export const detectTag = async (packageName: string, version: string) => {
  const prereleaseName = semver.prerelease(version)?.[0] ?? undefined
  const isPreRelease = prereleaseName !== undefined;
  if (prereleaseName && typeof prereleaseName !== 'string') {
    throw Error('prereleaseName is not a string got: ' + prereleaseName);
  }

  
  const [latestVersion, isLatestVersion] = await getLatestVersion(packageName, version);
  const [latestMinorVersion, isLatestMinorVersion] = await getLatestMinorVersion(packageName, version);
    
  
  // Every release requires a tag
  // Prereleases get their prelease name as tag
  // Latest major version gets latest
  // Anything else gets v1-lts, v2-lts, etc.
  
  if (isPreRelease) {
    return prereleaseName as string;
  } else if (isLatestVersion) {
    return 'latest';
  } else if (isLatestMinorVersion) {
    return `v${semver.major(version)}-lts`;
  } else {
    core.error(`You are trying to publish a version that is not the latest major or major.minor version`)
    core.error(`Target version you want to publish: ${version}`)
    core.error(`Latest version: ${latestVersion}`)
    core.error(`Latest minor version: ${latestMinorVersion}`)
    throw new Error('Error detecting tag');
  }
};
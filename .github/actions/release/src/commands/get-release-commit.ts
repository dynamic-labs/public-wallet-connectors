import * as core from '@actions/core';
import { getReleaseCommits } from "../lib/getReleaseCommits.js"

const getReleaseCommit = () => {
  core.startGroup('Get Release Commit');
  const [from,to,version] = getReleaseCommits();
  core.info(`Release commit: ${JSON.stringify(
    {
      from, to, version
    }
  )}`);
  core.setOutput('fromSha', from.sha);
  core.setOutput('toSha', to.sha);
  core.setOutput('version', version);
  core.endGroup();
}

getReleaseCommit();
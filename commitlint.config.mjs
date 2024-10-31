// @ts-check
async function getConfig() {
  const {
    default: {
      utils: { getProjects },
    },
  } = await import('@commitlint/config-nx-scopes');

  return {
    extends: ['@commitlint/config-conventional'],
    rules: {
      'body-max-line-length': [2, 'always', '500'],
      'scope-enum': async (ctx) => [
        2,
        'always',
        [
          ...(await getProjects(
            ctx,
            ({name, projectType}) =>
              !name.includes('e2e')
          )),
          'ci',
          'bump-version'
        ],
      ],
    },
    // . . .
  };
}

export default getConfig();

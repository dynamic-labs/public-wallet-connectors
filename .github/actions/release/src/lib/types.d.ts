declare namespace NodeJS {
    export interface ProcessEnv {
        NX_WORKSPACE_ROOT: string;
        GITHUB_TOKEN: string;
        GITHUB_ACTION: string | undefined;
        GITHUB_WORKSPACE: string;
        GITHUB_REPOSITORY: string;
    }
}
declare namespace NodeJS {
    export interface ProcessEnv {
        NX_WORKSPACE_ROOT: string;
        GITHUB_TOKEN: string;
        GITHUB_ACTION: string | undefined;
    }
}
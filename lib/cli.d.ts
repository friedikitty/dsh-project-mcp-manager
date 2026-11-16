#!/usr/bin/env node
export interface CliIo {
    out(line: string): void;
    err(line: string): void;
}
export interface CliDeps {
    /** 用户主目录（测试注入）：给出时用户层固定为 `<home>/.dsh`，忽略 `$DSH_HOME`。 */
    home?: string;
    /** 项目根解析（默认向上找 .git，测试注入）。 */
    resolveProjectRoot?: (cwd: string) => Promise<string>;
    /** `import --from -` 的 stdin（测试注入；缺省读 `process.stdin`）。 */
    readStdin?: () => Promise<string>;
}
interface ParsedArgs {
    positional: string[];
    /** 未显式给出时为 undefined：list 展示全部层；add/remove/get 缺省按 project。 */
    scope?: "project" | "user" | "profile";
    /** 写入格式：缺省时取 DSH_MCP_CLI_FORMAT，再缺省 yml。 */
    format?: "yml" | "json";
    /** --scope profile 的目标 profile 名。 */
    profile?: string;
    transport: "stdio" | "http";
    env: Record<string, string>;
    headers: Record<string, string>;
    cwd?: string;
    help: boolean;
    /** import 输入：文件路径或 `-`（stdin）。 */
    from?: string;
    dryRun: boolean;
    overwrite: boolean;
}
/** CLI 写入格式的默认值开关：`yml`（默认）或 `json`；`--format` 优先。 */
export declare const CLI_FORMAT_ENV = "DSH_MCP_CLI_FORMAT";
/**
 * 手搓 argv 解析（零依赖）：`--` 之后全按位置参数；未知「选项」视为服务器命令行
 * token 透传（刻意策略：宁可透传也不误伤 spawn 参数）。
 */
export declare function parseArgs(argv: string[]): ParsedArgs | {
    error: string;
};
export declare function runCli(argv: string[], io: CliIo, deps?: CliDeps): Promise<number>;
export {};

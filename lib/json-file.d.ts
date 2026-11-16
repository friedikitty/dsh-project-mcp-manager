import { z } from "zod";
import { type PatchRow } from "./mcp-file.js";
import { type McpServerInput } from "./model.js";
/** DSH 自有 JSON 配置文件名（位于 `<root>/.dsh/`、`$DSH_HOME/`、`$DSH_HOME/profiles/<name>/`）。 */
export declare const JSON_MCP_FILE = "mcp.json";
/** 对方插件（`@wingsky-1/dsh-mcp-manager`）的全局存储文件名（位于 `$DSH_HOME/`）。 */
export declare const FOREIGN_MCP_JSON_FILE = "dsh-mcp.json";
/** 对方 `{version, servers}` 存储格式的可执行诊断（本插件不读取该方言）。 */
export declare const FOREIGN_MCP_FORMAT_HINT = "\u8BE5\u6587\u4EF6\u7591\u4F3C @wingsky-1/dsh-mcp-manager \u7684\u5B58\u50A8\u683C\u5F0F\uFF08{version, servers}\uFF09\uFF0C\u672C\u63D2\u4EF6\u4E0D\u8BFB\u53D6\u3002\u5EFA\u8BAE\u6539\u7528 mcpServers \u65B9\u8A00\uFF0C\u6216\u6539\u7528 .dsh/mcp.yml";
/** 对方文件名里误写了本插件 `mcpServers`：不装载，提示改用 mcp.json。 */
export declare const FOREIGN_MCP_WRONG_FILE_HINT = "\u8BE5\u6587\u4EF6\u540D\u4E3A dsh-mcp.json\uFF08@wingsky-1/dsh-mcp-manager \u7684\u5168\u5C40\u5B58\u50A8\uFF09\uFF0C\u672C\u63D2\u4EF6\u4E0D\u4ECE\u6B64\u8DEF\u5F84\u88C5\u8F7D\u3002\u8BF7\u628A mcpServers \u5199\u5230 mcp.json";
/**
 * 检测对方插件的存储格式。本插件方言文件（mcp.json / .mcp.json）里一旦有
 * `mcpServers`（即便同时有 `servers`）就不告警。对方文件名 `dsh-mcp.json`
 * 即使写了 `mcpServers` 也不装载，并提示改用 mcp.json。缺 `mcpServers` 且顶层
 * 是 `servers` 数组，或同时有 `version` 与 `servers`，认定为对方格式。
 */
export declare function detectForeignMcpFormat(value: Record<string, unknown>, fileName?: string): string | undefined;
/** 遗留 Claude Code project 层文件名（位于项目根，与 `.dsh/` 并列，只读）。 */
export declare const CC_PROJECT_FILE = ".mcp.json";
/** 置为 "1" 时跳过遗留 `<projectRoot>/.mcp.json` 的读取与监听；DSH 自有 JSON 层不受影响。 */
export declare const IGNORE_MCP_JSON_ENV = "DSH_MCP_IGNORE_MCP_JSON";
/** 遗留 CC 项目层是否启用：默认开，`DSH_MCP_IGNORE_MCP_JSON=1` 关。 */
export declare function mcpJsonLayerEnabled(env?: NodeJS.ProcessEnv): boolean;
/**
 * 配置行来源。数组顺序即影子优先序（先到先得）：
 * `dsh-project` > `dsh-project-json` > `cc-project` > `dsh-profile-user-yml` > `dsh-profile-user` > `dsh-user-yml` > `dsh-user`。
 * 前三者是项目层（按项目装载、按会话隔离），后四者是用户层（宿主级全局装载）。
 */
export type McpRowSource = "dsh-project" | "dsh-project-json" | "cc-project" | "dsh-profile-user-yml" | "dsh-profile-user" | "dsh-user-yml" | "dsh-user";
/** 带来源标记的配置行：主管线合并与快照展示用。disabled=true 的行参与占名
 *  （遮蔽下层同名）但不进入装载集合。 */
export interface SourcedRow {
    rawName: string;
    row: PatchRow;
    source: McpRowSource;
    disabled?: boolean;
}
export interface JsonReadResult {
    rows: SourcedRow[];
    /** 单条坏条目（sse/缺字段/坏名字）的报错，逐条收集，不影响其余条目。 */
    entryErrors: string[];
    /** 整文件级错误（不存在=正常空结果；解析失败等）。消息不含文件内容。 */
    fileError?: string;
    /**
     * 文件存在、缺 `mcpServers`、且顶层像 `{version, servers}`（对方插件存储格式）时的
     * 诊断。缺 `mcpServers` 仍是合法空层；此字段只为「配了但不生效」提供可执行说明。
     */
    formatHint?: string;
}
/** stdio 空 cwd 的解析策略：项目层=项目根；用户层=继承宿主工作目录。 */
export type JsonCwdPolicy = "project" | "host";
export interface JsonReadOptions {
    source: McpRowSource;
    cwdPolicy: JsonCwdPolicy;
    /** 项目根（cwdPolicy="project" 时空 cwd 的落点；用户层传空串）。 */
    projectRoot: string;
    /** true：缺 `mcpServers` 报文件级错误（遗留 CC 文件语义）；false：视为空层。 */
    requireMcpServers?: boolean;
}
/**
 * 单条目宽松 schema：未知字段（timeout/scope 等生态附加键）容忍并忽略。
 * `type` 缺省视为 stdio（有 url/httpUrl 无 command 时按 http 推断）。
 * `transport` 与 `httpUrl` 为原生/Gemini 方言别名，由 jsonEntryToInput 归一。
 */
export declare const jsonServerEntrySchema: z.ZodObject<{
    mode: z.ZodOptional<z.ZodEnum<{
        eager: "eager";
        lazy: "lazy";
    }>>;
    type: z.ZodOptional<z.ZodString>;
    transport: z.ZodOptional<z.ZodString>;
    command: z.ZodOptional<z.ZodString>;
    args: z.ZodOptional<z.ZodArray<z.ZodString>>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    cwd: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    httpUrl: z.ZodOptional<z.ZodString>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    disabled: z.ZodOptional<z.ZodBoolean>;
    toolCallTimeoutMs: z.ZodOptional<z.ZodNumber>;
    failOnStartupError: z.ZodOptional<z.ZodBoolean>;
    maxInstructionBytes: z.ZodOptional<z.ZodNumber>;
    reconnect: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        initialDelayMs: z.ZodOptional<z.ZodNumber>;
        maxDelayMs: z.ZodOptional<z.ZodNumber>;
        maxAttempts: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    tools: z.ZodOptional<z.ZodObject<{
        allow: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deny: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    includeTools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    excludeTools: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$loose>;
export type JsonServerEntry = z.infer<typeof jsonServerEntrySchema>;
/** 单条 JSON 条目 → 官方输入。坏条目返回 `{ error }` 由调用方逐条收集。 */
export declare function jsonEntryToInput(name: string, entry: JsonServerEntry, options: JsonReadOptions): {
    input: McpServerInput;
} | {
    error: string;
};
/** `mcpServers` 值 → SourcedRow 列表；坏条目逐条报错跳过。 */
export declare function parseJsonServersValue(mcpServers: unknown, options: JsonReadOptions): {
    rows: SourcedRow[];
    entryErrors: string[];
};
/** 通用 JSON 方言读取：文件缺失 → 空结果；坏条目逐条报错。 */
export declare function readJsonRows(path: string, options: JsonReadOptions): Promise<JsonReadResult>;
/** 读 DSH 自有 JSON 层（缺 `mcpServers` 视为空层）。 */
export declare function readDshJsonFile(path: string, options: JsonReadOptions): Promise<JsonReadResult>;
/** 读遗留 `<projectRoot>/.mcp.json`（CC project scope；缺 `mcpServers` 报文件级错误）。 */
export declare function readMcpJsonFile(path: string, projectRoot: string): Promise<JsonReadResult>;

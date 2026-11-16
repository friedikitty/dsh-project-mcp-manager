/**
 * dsh-project-mcp-manager —— MCP 服务器配置模型（纯函数）。
 *
 * 模型本身不含 scope：scope 是配置所在文件（profile cordis.patch.yml =
 * 全局，<projectRoot>/.dsh/mcp.yml = 项目）的属性。env/headers 的 null 是
 * 编辑语义：string = 覆盖该 key，null = 删除该 key，不出现 = 保留旧值。
 */
import { z } from "zod";
import { type PatchRow } from "./mcp-file.js";
export declare const SERVER_NAME_RE: RegExp;
/** url 字段允许合法 URL 或含 `${VAR}` 占位的串（整值与串内插值同待）：装载前
 * 一律放行占位串，展开后的真实合法性由 mount 复验兜底（env-invalid 诊断）。 */
export declare function isUrlOrEnvRef(value: string): boolean;
/**
 * 字符串数组比较器：UTF-16 码元序，与 `Array#sort` 默认行为逐字节等价。
 * 全仓凡排序结果 wire 可见（诊断/快照键集、告警门控签名、list 输出序）都必须
 * 用显式比较器写死这个口径——默认序不经 locale collator，不随宿主区域设置漂移。
 */
export declare function byCodeUnit(a: string, b: string): number;
/**
 * glob → 正则：`*` 不跨 `/`，`**` 跨段，`?` 单字符，`[abc]` / `[!abc]` 字符类。
 * 工具名通常不含 `/`，`*` 与 `**` 对裸名等价，完整 `mcp__…__…` 路径才用得上 `**`。
 */
export declare function globToRegExp(pattern: string): RegExp;
export declare function matchToolGlob(pattern: string, name: string): boolean;
/** 非法字符类等会导致 `RegExp` 抛错的 glob；合法则返回 undefined。 */
export declare function toolGlobCompileError(pattern: string): string | undefined;
/** 过滤里无法编译的 glob 原文（去重）；调用方记条目警告，匹配仍跳过该模式。 */
export declare function invalidToolGlobs(filter: ToolFilter | undefined): string[];
export interface ToolFilter {
    allow?: string[];
    deny?: string[];
}
/**
 * 条目级工具过滤：`allow` 缺省全开；`deny` 优先。只返回当前已注册的完整工具名
 * （`mcp__<effective>__<tool>`），供 `tools.restrict` 使用。
 */
export declare function deniedToolsForFilter(effectiveName: string, filter: ToolFilter | undefined, registeredToolIds: string[]): string[];
export declare function toolFilterFromConfig(config: Record<string, unknown> | undefined): ToolFilter | undefined;
export declare const DEFAULT_TOOL_CALL_TIMEOUT_MS = 60000;
export declare const DEFAULT_RECONNECT: {
    readonly enabled: true;
    readonly initialDelayMs: 500;
    readonly maxDelayMs: 30000;
    readonly maxAttempts: 10;
};
/**
 * 与官方 dsh-mcp-client 的 reconnect 上限一致（@deepseek-ai/dsh-mcp-client
 * 0.2.1-rc.2 lib/index.js 的 reconnect schema `.max(MAX_TIMER_DELAY_MS)`）；
 * 2147483647 = MAX_TIMER_DELAY_MS（@deepseek-ai/dsh-timeout，Node 不钳制的最大
 * timer 延迟）。上限不镜像的话越界值会绕过本地校验，到 ctx.plugin 装载时才以
 * plugin-throw 爆错，归因更晚更难查。
 */
export declare const MAX_TIMER_DELAY_MS = 2147483647;
/**
 * 官方 `@deepseek-ai/dsh-mcp-client` 0.2.1-rc.2 支持的 MCP 传输集合
 * （config.transport 判别联合：`stdio` | `streamable-http`）。本插件不实现
 * 传输，只负责表达；schema / CLI / JSON 读取器 / 报错文案全部从这里派生。
 * 官方新增传输时：常量加值 + 一条 CLI/JSON 别名映射 + 文档 + 测试，不要再
 * 加判定分支。性质与 `MAX_TIMER_DELAY_MS` 相同。
 */
export declare const SUPPORTED_MCP_TRANSPORTS: readonly ["stdio", "streamable-http"];
export type SupportedMcpTransport = (typeof SUPPORTED_MCP_TRANSPORTS)[number];
/** JSON/CLI 用户面写法 → 官方 transport。`http` 是 Cursor/CC 通行别名。 */
export declare const MCP_TRANSPORT_ALIASES: Record<string, SupportedMcpTransport>;
/**
 * 已知但不被装载后端支持的传输。走统一报错路径，不隐式回退、不静默跳过。
 * 官方若日后支持其中某一项：从本表删掉、加入 `SUPPORTED_MCP_TRANSPORTS` 与别名即可。
 */
export declare const UNSUPPORTED_MCP_TRANSPORTS: readonly ["sse"];
/** 官方 transport → JSON 方言 `type`（Cursor/CC 写 `http` 而非 `streamable-http`）。 */
export declare function jsonTypeOfTransport(transport: SupportedMcpTransport): "stdio" | "http";
export declare function isSupportedMcpTransport(value: string): value is SupportedMcpTransport;
export declare function isUnsupportedMcpTransport(value: string): boolean;
export declare function supportedTransportsLabel(separator?: string): string;
/** 未知/不受支持传输的报错（CLI 与 JSON 读取器共用）。 */
export declare function unsupportedTransportMessage(value: string): string;
/**
 * 用户面传输值（CLI `--transport`、JSON `type`/`transport`）→ 官方 transport。
 * 别名命中则映射；其余一律报错（含 `UNSUPPORTED_MCP_TRANSPORTS` 与完全陌生的值）。
 */
export declare function resolveMcpTransport(raw: string): {
    transport: SupportedMcpTransport;
} | {
    error: string;
};
/**
 * CLI `--transport`：官方名与 `http` 别名；内部仍用 `stdio` | `http`
 * （`add` 的用户面口径，与 `jsonTypeOfTransport` 一致）。
 * 已知不支持值走 `unsupportedTransportMessage`；完全陌生的值提示合法集合。
 */
export declare function parseCliTransport(value: string): {
    transport: "stdio" | "http";
} | {
    error: string;
};
export declare const mcpLoadingModeSchema: z.ZodEnum<{
    eager: "eager";
    lazy: "lazy";
}>;
export type McpLoadingMode = z.infer<typeof mcpLoadingModeSchema>;
export declare const stdioServerSchema: z.ZodObject<{
    serverName: z.ZodString;
    mode: z.ZodOptional<z.ZodEnum<{
        eager: "eager";
        lazy: "lazy";
    }>>;
    transport: z.ZodLiteral<"stdio">;
    command: z.ZodString;
    args: z.ZodDefault<z.ZodArray<z.ZodString>>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>;
    cwd: z.ZodDefault<z.ZodString>;
    toolCallTimeoutMs: z.ZodDefault<z.ZodNumber>;
    failOnStartupError: z.ZodDefault<z.ZodBoolean>;
    maxInstructionBytes: z.ZodOptional<z.ZodNumber>;
    reconnect: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        initialDelayMs: z.ZodDefault<z.ZodNumber>;
        maxDelayMs: z.ZodDefault<z.ZodNumber>;
        maxAttempts: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    tools: z.ZodOptional<z.ZodObject<{
        allow: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deny: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const httpServerSchema: z.ZodObject<{
    serverName: z.ZodString;
    mode: z.ZodOptional<z.ZodEnum<{
        eager: "eager";
        lazy: "lazy";
    }>>;
    transport: z.ZodLiteral<"streamable-http">;
    url: z.ZodString;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>;
    toolCallTimeoutMs: z.ZodDefault<z.ZodNumber>;
    failOnStartupError: z.ZodDefault<z.ZodBoolean>;
    maxInstructionBytes: z.ZodOptional<z.ZodNumber>;
    reconnect: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        initialDelayMs: z.ZodDefault<z.ZodNumber>;
        maxDelayMs: z.ZodDefault<z.ZodNumber>;
        maxAttempts: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    tools: z.ZodOptional<z.ZodObject<{
        allow: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deny: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const mcpServerInputSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    serverName: z.ZodString;
    mode: z.ZodOptional<z.ZodEnum<{
        eager: "eager";
        lazy: "lazy";
    }>>;
    transport: z.ZodLiteral<"stdio">;
    command: z.ZodString;
    args: z.ZodDefault<z.ZodArray<z.ZodString>>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>;
    cwd: z.ZodDefault<z.ZodString>;
    toolCallTimeoutMs: z.ZodDefault<z.ZodNumber>;
    failOnStartupError: z.ZodDefault<z.ZodBoolean>;
    maxInstructionBytes: z.ZodOptional<z.ZodNumber>;
    reconnect: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        initialDelayMs: z.ZodDefault<z.ZodNumber>;
        maxDelayMs: z.ZodDefault<z.ZodNumber>;
        maxAttempts: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    tools: z.ZodOptional<z.ZodObject<{
        allow: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deny: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    serverName: z.ZodString;
    mode: z.ZodOptional<z.ZodEnum<{
        eager: "eager";
        lazy: "lazy";
    }>>;
    transport: z.ZodLiteral<"streamable-http">;
    url: z.ZodString;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>;
    toolCallTimeoutMs: z.ZodDefault<z.ZodNumber>;
    failOnStartupError: z.ZodDefault<z.ZodBoolean>;
    maxInstructionBytes: z.ZodOptional<z.ZodNumber>;
    reconnect: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        initialDelayMs: z.ZodDefault<z.ZodNumber>;
        maxDelayMs: z.ZodDefault<z.ZodNumber>;
        maxAttempts: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    tools: z.ZodOptional<z.ZodObject<{
        allow: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deny: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>], "transport">;
export type McpServerInput = z.infer<typeof mcpServerInputSchema>;
export type McpTransport = McpServerInput["transport"];
export interface ReconnectConfig {
    enabled: boolean;
    initialDelayMs: number;
    maxDelayMs: number;
    maxAttempts: number;
}
export type SecretPatch = Record<string, string | null> | undefined;
/** 服务器所在作用域：全局（profile patch）或工作区（项目根路径）。 */
export interface McpScopeInfo {
    kind: "global" | "workspace";
    path?: string;
    label?: string;
}
/** 项目根的规范化键（Windows 大小写不敏感），作 Map 键用。 */
export declare function projectKeyOf(projectRoot: string): string;
/**
 * 冲突时的命名空间生效名：`p<sha256(projectKeyOf(projectRoot))前6位hex>_<原始名>`，
 * 截断到 32 字符（保持 SERVER_NAME_RE 合法）。确定性，与装载顺序、路径大小写
 * 写法无关。
 */
export declare function namespacedServerName(projectRoot: string, name: string): string;
/** 一个项目的原始 serverName 目录（供生效名计算）。 */
export interface ProjectServerCatalogEntry {
    projectRoot: string;
    names: string[];
}
/**
 * 计算全部 (projectRoot, 原始名) → 生效名的映射：
 * 原始名在整个目录（全局行 + 所有项目行）中唯一时保持原名；否则该名的
 * 每个项目拥有者都改用 namespacedServerName（全局行参与占用判定但不改名）。
 * 已挂载的 Eager 名称优先保留，除非被宿主全局名称占用。
 * `keepRawKeys` 中的项目（`projectKeyOf` 规范化后的项目根）在冲突时优先保留
 * 原名：同一原始名有多个 keepRaw 拥有者时按 `keepRawKeys` 的先后第一个保留
 * （即 `keepRawNamesFor` 的列表顺序），其余仍改名；被全局行占用的名字不会被
 * 项目行复用。pin 优先于 retained：即使 pin 项目此前挂载的是 namespaced 名，
 * 或其它项目已 retained 该原名，也以 pin 的裸名为准（可能触发对方重挂）。
 * 键 = projectKeyOf(projectRoot) + "\0" + 原始名。
 */
export declare function effectiveServerNames(projects: ProjectServerCatalogEntry[], globalNames?: string[], retained?: ReadonlyMap<string, string>, keepRawKeys?: Iterable<string>): Map<string, string>;
/**
 * 会话可见性：某会话项目应 deny 的生效名 = 全部已装载项目服务器 − 本会话
 * 项目的。sessionProject 为 undefined（无 cwd / 未知项目）时 deny 全部。
 */
export declare function denySetFor(sessionProject: string | undefined, mounted: {
    projectRoot: string;
    effectiveNames: string[];
}[]): string[];
/** 兼容 dsh-skill-mcp-panel 的行 id ↔ serverName。 */
export declare function rowIdForServerName(serverName: string): string;
/**
 * 行的原始 serverName：**受管行 id 优先**，其次 `config.serverName`。
 * 装载（registry）与 CLI 判重/删除必须同口径——反向优先（config 优先）会在
 * `id: panel-mcp-a` + `config.serverName: b` 这类不一致行上认成另一个名字，
 * 于是 CLI 删不掉装载器实际装载的那条。
 */
export declare function rowNameOf(row: PatchRow): string | undefined;
export declare function serverNameFromRowId(id: string | undefined): string | undefined;
/** null = 删除，string = 覆盖；缺省 key 保留旧值。 */
export declare function mergeSecretPatch(previous: Record<string, string> | undefined, patch: SecretPatch): Record<string, string>;
export type ExpandEnvRefsResult = {
    ok: true;
    input: McpServerInput;
} | {
    ok: false;
    missingVar: string;
};
/**
 * 运行时展开 command、args[*]、env/headers 值、url、cwd 中的 `${VAR}` 引用，
 * 支持串内插值（`Bearer ${TOKEN}` 与整值 `${TOKEN}` 都会展开），对齐 CC 的
 * 写法习惯。纯函数：环境经参数注入（宿主传 process.env），便于测试。
 * 任一被引用的变量缺失或为空串即整体失败（ok:false + 变量名，调用方据此
 * 跳过该条目装载）——空 token 与缺失同样危险，宁可 spawn 前拒绝。诊断
 * 消息只含变量名不含值。`$VAR` 裸形与 `${9bad}` 非法名保持字面量。
 */
export declare function expandEnvRefs(input: McpServerInput, env: NodeJS.ProcessEnv): ExpandEnvRefsResult;
/** 面板输入 → 官方 @deepseek-ai/dsh-mcp-client 配置。 */
export declare function toOfficialConfig(input: McpServerInput): import("@deepseek-ai/dsh-mcp-client").Config & Record<string, unknown>;
/** 输入 → cordis.patch.yml / 项目 mcp.yml 行。 */
export declare function toPatchRow(input: McpServerInput, enabled?: boolean): PatchRow;
/**
 * 服务身份键，与装载器三把影子键里的身份键同一口径。
 * stdio 看「可执行文件 + 参数」，http 看 url。command/url 缺失或为空则没有身份键
 * （disabled 占名行常无 config，只占名字）。Windows 下 command 小写；args 逐项
 * 字符串化后以 `\0` 连接，顺序和内容都要一致。
 */
export declare function serviceIdentityKeyOf(config: {
    transport?: unknown;
    command?: unknown;
    args?: unknown;
    url?: unknown;
}): string | undefined;
/** 读取 patch 行中的 config（宽松，坏行返回 undefined）。 */
export declare function configFromPatchRow(row: PatchRow | undefined): Record<string, unknown> | undefined;
export interface McpServerView {
    serverName: string;
    mode?: McpLoadingMode;
    transport: McpTransport | "unknown";
    enabled: boolean;
    entryId: string | undefined;
    /** 行所属作用域与装载时生效名（与 serverName 不同仅当发生命名冲突）。 */
    scope?: McpScopeInfo;
    effectiveServerName?: string;
    command?: string;
    args?: string[];
    envKeys: string[];
    cwd?: string;
    url?: string;
    headerKeys: string[];
    /** 条目级工具过滤（模式原文，不含密钥）。 */
    tools?: ToolFilter;
    toolCallTimeoutMs: number;
    failOnStartupError: boolean;
    /** 仅当配置行显式写出时出现；缺省表示沿用官方 32768。 */
    maxInstructionBytes?: number;
    reconnect: ReconnectConfig;
}
/** patch 行 → 脱敏 view。密钥值不返回。scope/effectiveServerName 由调用方给出。 */
export declare function patchRowToView(row: PatchRow, scope?: McpScopeInfo, effectiveServerName?: string): McpServerView | undefined;
/** 从 patch 行读取完整输入（含 secret 值，仅供本机装载/测试使用，不跨 RPC）。 */
export declare function inputFromPatchRow(row: PatchRow): McpServerInput;

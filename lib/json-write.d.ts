import { type McpServerInput } from "./model.js";
/**
 * `mcpServers` 映射。值类型是 unknown 而非对象：文件里可能存在非对象条目
 * （`"legacy": "node x.js"` 这类手写错误），读-改-写必须原样带过，不能顺手删。
 * 写入方（CLI）只新增/删除自己指名的键。
 */
export type JsonServers = Record<string, unknown>;
/**
 * 读 JSON 文档：缺失/空文件 → `{}`；解析失败或顶层非对象 → 抛错（消息不含文件内容）。
 * 调用方据此拒绝写入，避免把无法解析的文件覆盖掉。
 */
export declare function readJsonDocument(path: string): Promise<Record<string, unknown>>;
/**
 * 读现有 `mcpServers` 映射（缺失/null → 空映射；顶层非对象 → 抛错）。
 * 条目一律保留（含非对象的坏条目）：CLI 的判重要能看见坏条目占用的名字，
 * `remove <坏条目名>` 也才能把它清掉。装载侧的坏条目过滤在 json-file.ts。
 */
export declare function readJsonServers(path: string): Promise<JsonServers>;
/**
 * 锁内读-改-写 `mcpServers`：mutate 收到锁内的最新映射，返回值（或原地修改）即写回值。
 * 加锁 + 原子写；写前自校验（序列化结果必须可解析回来）。返回写回后的映射。
 */
export declare function updateJsonServers(path: string, mutate: (servers: JsonServers) => JsonServers | void): Promise<JsonServers>;
/** 整体替换 `mcpServers`（保留其余顶层键与键序）。 */
export declare function writeJsonServers(path: string, servers: JsonServers): Promise<JsonServers>;
/**
 * 官方输入 → JSON 条目（Cursor/CC 方言 + DSH 透传键）。
 * 缺省值不落盘（`args: []`、空 `env`/`headers`、空或 "." 的 `cwd`、默认
 * `toolCallTimeoutMs`/`failOnStartupError`/`maxInstructionBytes`/`reconnect`），保持文件简洁可读。
 * `${VAR}` 原样保留，装载时才展开——凭据不落盘。
 */
export declare function toJsonEntry(input: McpServerInput): Record<string, unknown>;

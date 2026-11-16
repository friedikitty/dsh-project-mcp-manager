/**
 * dsh-project-mcp-manager —— MCP 行运行时状态读取（工具计数与预算）。
 */
export declare const TOOL_BUDGET_WARN_ENV = "DSH_MCP_TOOL_BUDGET_WARN";
export declare const DEFAULT_TOOL_BUDGET_COUNT = 200;
export declare const DEFAULT_TOOL_BUDGET_BYTES: number;
/** `DSH_MCP_TOOL_BUDGET_WARN`：`工具数` 或 `工具数,字节数`；缺省 200 / 256KiB。 */
export declare function parseToolBudgetWarn(raw?: string | undefined): {
    maxTools: number;
    maxBytes: number;
};
/** 工具层 schema 的 id 口径：官方 `ToolSchema` 只有 `name`；假 ctx 可能只有 `id`。deny 展开与预算统计共用。 */
export declare function schemaToolId(schema: any): string;
/** 统计某 serverName 当前在全局工具层注册的工具数（前缀 mcp__<serverName>__）。 */
export declare function mcpToolCount(ctx: any, serverName: string): number;
/** 某生效名下已注册工具的数量与描述/schema 字节（只读，不裁剪）。 */
export declare function mcpToolBudgetStats(ctx: any, serverName: string): {
    tools: number;
    bytes: number;
};

/** Shared identifiers only: importing these must not load the MCP SDK or registry. */
export declare const LAZY_TOOL_NAMES: readonly ["mcp_search", "mcp_describe", "mcp_call"];
/** Not a valid serverName, so the shared proxy group cannot collide with a server. */
export declare const LAZY_PROXY_GROUP_NAME = "[lazy proxies]";
/** Whether a model-facing tool name is exactly one of the three Lazy proxies. */
export declare function isLazyToolName(name: string): boolean;

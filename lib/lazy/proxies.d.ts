import type { Context } from "@deepseek-ai/cordis";
import type { ProjectServerState } from "../registry.js";
import type { LazyConnections, LazyTool } from "./connection.js";
export { LAZY_TOOL_NAMES, isLazyToolName } from "./tool-names.js";
export type LazyMount = ProjectServerState & {
    lazy: LazyConnections;
};
type VisibleMounts = () => LazyMount[];
type LazySession = {
    id: string;
    visible: VisibleMounts;
};
/**
 * Internal test seam: apply one row's `tools.allow` / `deny` to a Lazy catalog.
 * Not re-exported from the package entry.
 */
export declare function allowedTools(state: LazyMount, tools: LazyTool[]): LazyTool[];
/**
 * Mirror the official Eager bridge's public name for existing full-name filters.
 * The official package does not export its naming helper; the parity test drives
 * the public `apply` entry against a local MCP server instead of importing internals.
 * Exported for lib-internal tests only; the package entry does not re-export it.
 */
export declare function eagerToolName(server: string, tool: string, raw: string): string;
export declare function registerLazyTools(ctx: Context, resolve: (agent: unknown) => Promise<LazySession>): () => void;

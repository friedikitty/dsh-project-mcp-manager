/**
 * dsh-project-mcp-manager —— 独立项目级 MCP 自动加载插件（宿主半区，无 UI）。
 *
 * 用法：在项目根创建 <projectRoot>/.dsh/mcp.yml（原生受管块，格式与
 * profile cordis.patch.yml 一致）或 .dsh/mcp.json（JSON 方言），在该项目
 * 开启 dsh 会话时自动装载其中的 MCP 服务器（经 @deepseek-ai/dsh-mcp-client），
 * 文件改动经 watch 热重载。
 *
 * 装载模型见 README 与 docs/guide/layers.md；查询面见 docs/guide/service.md；
 * 运行时行为见 registry.ts 的类注释。
 */
import { Context } from "@deepseek-ai/cordis";
export { bindProjectMcpService, PROJECT_MCP_SERVICE, PROJECT_MCP_UPDATED_EVENT, type ProjectMcpService } from "./service.js";
export type { FiberPhaseView, McpAddDraft, McpServerRuntimeView, McpWriteTarget, ProjectFileState, ProjectServerPhase, ProjectServerState } from "./registry.js";
export type { McpLoadingMode, McpScopeInfo, McpServerView, McpTransport, ReconnectConfig, ToolFilter } from "./model.js";
export { projectKeyOf, serviceIdentityKeyOf } from "./model.js";
export type { PatchRow } from "./mcp-file.js";
export type { McpRowSource } from "./json-file.js";
export type { ContextCostLevel, McpContextCost, McpResultCost, McpResultServerCost, McpServerContextCost } from "./context-cost.js";
export { CODE_MODE_TOOL_NAME, CONTEXT_COST_ALERT_TOKENS, CONTEXT_COST_WARN_TOKENS, contextCostLevel, contextCostSignature, estimateContentTokens, estimateMessageTokens, estimateSchemaTokens, isCodeModeTools, mcpContextCost, mcpResultCost, mcpServerOfTool, resultCostSignature } from "./context-cost.js";
export declare const name = "dsh-project-mcp-manager";
/** agents 为硬依赖：宿主启动早期插件行先于 agents 服务装载时，等待其就绪后再 apply，
 *  保证构造时的 liveAgents 补扫能看到已恢复/已存在的会话。 */
export declare const inject: string[];
/** 显式指定 profile 名的环境变量（实现在 dsh-paths.ts，registry 的校验共用）。 */
export { PROFILE_ENV } from "./dsh-paths.js";
export declare function apply(ctx: Context, config?: unknown): void;

/**
 * 会话级 MCP 上下文占用估算（纯函数）。
 *
 * 两份口径：
 * - 工具定义：输入是某个会话可见的工具 schema（`agent.ctx` 视角的
 *   `tools.schemas()`，已经过本插件的 deny 与条目 allow/deny）。统计
 *   `mcp__<生效名>__<工具>` 及可见的三个 Lazy 代理，按
 *   `ceil(JSON.stringify(tools).length / 4) + 4` 计价。
 * - 工具调用结果：输入是会话当前模型可见的消息（`session.deriveMessages()`），
 *   只取仍留在 surface 上的 `tool/result` 消息，按 DSH token-meter 的逐条消息
 *   口径计价。被裁剪或压缩掉的结果不在当前上下文里，不计。
 *
 * 两者都是估算，不是 provider 精确计数；工具定义口径也不含服务器 instructions。
 *
 * 代码模式（PTC / run_code）下两份口径都无法成立：工具定义被渲染进系统提示词
 * 的 `tools:sdk` 文本（不是逐工具的请求 `tools` 列表），MCP 调用又嵌在 `run_code`
 * 内部、surface 上只剩外层结果。此时返回 `unsupported: "code-mode"`，由调用方
 * 明确显示「无法估算」，而不是给出误导性的零或按原生口径硬算。
 */
export declare const MCP_TOOL_PREFIX = "mcp__";
/**
 * 代码模式（PTC）执行器对外暴露的唯一工具名。宿主把它列为保留名（注册/限制
 * 都会拒绝），所以某次请求的 `tools` 里出现它就等价于该会话走 PTC。这里镜像
 * 宿主常量、不新增依赖；判定只读请求头，不触碰执行器私有接口。
 */
export declare const CODE_MODE_TOOL_NAME = "run_code";
/**
 * 某次请求的工具列表是否来自代码模式（PTC）执行器。`run_code` 是保留名，
 * 原生执行器不会注册它，因此出现即判定为代码模式。只读、不抛错。
 */
export declare function isCodeModeTools(tools: readonly unknown[] | undefined): boolean;
/** 提醒阈值：达到后抬头标签变为提醒色。 */
export declare const CONTEXT_COST_WARN_TOKENS = 5000;
/** 警告阈值：达到后标签变为警告色并加警告图标。 */
export declare const CONTEXT_COST_ALERT_TOKENS = 10000;
export type ContextCostLevel = "ok" | "warn" | "alert";
export interface McpServerContextCost {
    /** 服务器生效名；Lazy 公共代理使用保留的合成组名 `[lazy proxies]`。 */
    name: string;
    /** 仅共享代理组设置；缺省仍为普通服务器，兼容既有调用方。 */
    kind?: "lazy-proxy";
    tools: number;
    chars: number;
    estTokens: number;
}
export interface McpContextCost {
    /** 被统计的会话 id；找不到当前会话时为 null，其余字段为零。 */
    sessionId: string | null;
    tools: number;
    chars: number;
    estTokens: number;
    level: ContextCostLevel;
    /** 模型上下文窗口（来自会话最近一次请求的路由信息）；未知时省略。 */
    contextWindow?: number;
    /** 按估算 token 从大到小排序。 */
    servers: McpServerContextCost[];
    warnTokens: number;
    alertTokens: number;
    /**
     * 代码模式（PTC）下定义走系统提示词渲染，无法按工具 schema 估算；
     * 置 `"code-mode"` 时其余数值字段为零、`servers` 为空，调用方应显示「无法估算」。
     */
    unsupported?: "code-mode";
}
/** DSH token-meter 的工具 schema 估算口径。空列表为 0。 */
export declare function estimateSchemaTokens(chars: number): number;
export declare function contextCostLevel(estTokens: number, warn?: number, alert?: number): ContextCostLevel;
/**
 * 工具名归属的服务器生效名。优先匹配已知生效名里最长的前缀（生效名本身可含 `__`），
 * 否则取 `mcp__` 之后到下一个 `__` 为止。不是 MCP 工具时返回 undefined。
 */
export declare function mcpServerOfTool(toolName: string, knownServers?: readonly string[]): string | undefined;
export interface ContextCostInput {
    sessionId: string | null;
    /** 该会话可见的工具 schema；会话缺失时传空数组。 */
    schemas: readonly unknown[];
    knownServers?: readonly string[];
    contextWindow?: number;
    warnTokens?: number;
    alertTokens?: number;
    /** 会话走代码模式（PTC）：定义无法按 schema 估算，返回 unsupported。 */
    codeMode?: boolean;
}
/**
 * 汇总一份会话工具视图里的 MCP 定义占用。`deferLoading` 的工具不进本次请求，不计。
 * 共享 Lazy 代理按会话工具列表只计一组，不按服务器数量复制，也不连接/读取远端目录。
 * 总数按整组 schema 一次估算（与 DSH 对 `header.tools` 的口径一致），
 * 各服务器分别按自己那组估算，所以分项之和与总数可能差几个 token。
 */
export declare function mcpContextCost(input: ContextCostInput): McpContextCost;
/** 模型可见消息的最小形状；只读计价，不复制内容。 */
export interface ContextMessageLike {
    readonly role?: string;
    readonly content?: readonly unknown[];
    readonly source?: {
        readonly callId?: string;
    };
    readonly toolCallId?: string;
}
/** 一台服务器（或共享 Lazy 代理组）仍留在会话里的调用结果。 */
export interface McpResultServerCost {
    /** 服务器生效名；无法归属到单台服务器的 Lazy 结果归入 `[lazy proxies]`。 */
    name: string;
    /** `lazy`：经 Lazy 代理调用的某台服务器；`lazy-proxy`：跨服务器的共享代理结果。 */
    kind?: "lazy" | "lazy-proxy";
    /** 结果消息条数（每条对应一次已完成的调用）。 */
    calls: number;
    estTokens: number;
}
/** 会话当前仍保留的 MCP 工具调用结果占用。 */
export interface McpResultCost {
    /** 被统计的会话 id；找不到当前会话时为 null，其余字段为零。 */
    sessionId: string | null;
    /** 计入的结果消息条数；被裁剪或压缩掉的不算。 */
    calls: number;
    estTokens: number;
    /** 模型上下文窗口（来自会话最近一次请求的路由信息）；未知时省略。 */
    contextWindow?: number;
    /** 按估算 token 从大到小排序。 */
    servers: McpResultServerCost[];
    /**
     * 代码模式（PTC）下 MCP 调用嵌在 `run_code` 内部，surface 上无法归属到
     * 具体 MCP 结果；置 `"code-mode"` 时 `calls`/`estTokens` 为零、`servers` 为空。
     */
    unsupported?: "code-mode";
}
export interface ResultCostInput {
    sessionId: string | null;
    /** 会话当前的模型可见消息（`session.deriveMessages()`）；会话缺失时传空数组。 */
    messages: readonly unknown[];
    knownServers?: readonly string[];
    contextWindow?: number;
    /** 会话走代码模式（PTC）：结果无法归属，返回 unsupported。 */
    codeMode?: boolean;
}
/**
 * 一组模型可见 content 的估算 token。口径镜像
 * `@deepseek-ai/dsh-token-meter/estimate` 的 `estimateContent`：文本/推理按
 * `ceil(字符数 / 4) + 4`，tool-call 按名字与原始参数串，未知块按 JSON 结构。
 */
export declare function estimateContentTokens(blocks: readonly unknown[]): number;
/**
 * 一条模型可见消息的估算 token。镜像 token-meter 的 `estimateMessage`：
 * system 只按文本字符计价，其它角色是 content 价加 4 的角色开销。
 */
export declare function estimateMessageTokens(message: ContextMessageLike): number;
/**
 * 汇总会话当前 surface 上仍保留的 MCP 工具调用结果。只统计能对应到 MCP 工具调用的
 * `tool/result` 消息：Eager 按 `mcp__<生效名>__<工具>` 归属；Lazy 按代理参数里的
 * `server` 归属，`mcp_search` 未指定服务器时归入共享代理组。被裁剪、压缩或已不在
 * surface 上的结果不进入当前上下文，因此不计。
 */
export declare function mcpResultCost(input: ResultCostInput): McpResultCost;
/** 推送去重用的签名：只含会改变显示的字段。 */
export declare function contextCostSignature(cost: McpContextCost): string;
/** 推送去重用的签名：只含会改变显示的字段。 */
export declare function resultCostSignature(cost: McpResultCost): string;

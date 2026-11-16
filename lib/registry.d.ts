import { type PatchRow } from "./mcp-file.js";
import { type UserLayerPaths } from "./dsh-paths.js";
import { type McpRowSource, type SourcedRow } from "./json-file.js";
import { type McpLoadingMode, type McpServerView } from "./model.js";
import { LazyConnections } from "./lazy/connection.js";
import { type McpContextCost, type McpResultCost } from "./context-cost.js";
/** 项目 MCP 配置文件名（位于项目根 `.dsh/` 下）。 */
export declare const PROJECT_MCP_FILE = "mcp.yml";
/**
 * 从 loader 根 include 的配置路径（或 `ctx.baseUrl`）解析当前 profile 名。
 * profile 的根配置固定为 `<dshHome>/profiles/<name>/cordis.yml`（replay 模式为
 * `cordis.snapshot.yml`）；解析不出返回 undefined（调用方降级为不读 profile 层）。
 */
export declare function profileNameFromConfigPath(raw: unknown): string | undefined;
export type ProjectServerPhase = "mounting" | "active" | "failed" | "unloading";
/** 面板状态 → wire fiberPhase 词汇（wire 无 "mounting"）。 */
export declare function phaseToFiberPhase(phase: ProjectServerPhase): "loading" | "active" | "failed" | "unloading";
/** 一个已装载（或装载中）的 MCP 服务器的运行时状态。 */
export interface ProjectServerState {
    /** 项目根；全局层行为空串（scope="global"）。 */
    projectRoot: string;
    /** 作用域：项目层按项目装载 + 会话隔离；全局层宿主级只挂一条、对所有会话可见。 */
    scope?: "project" | "global";
    rawName: string;
    effectiveName: string;
    row: PatchRow;
    /** 行来源（遮蔽优先序见模块注释）；旧调用方可缺省。 */
    source?: McpRowSource;
    fiber?: any;
    lazy?: LazyConnections;
    phase: ProjectServerPhase;
    error?: string;
}
export type FiberPhaseView = "loading" | "active" | "failed" | "unloading" | "pending" | null;
/** snapshot / serverView 的行级脱敏 view（随 `projectMcp` 查询面按语义化版本演进）。 */
export interface McpServerRuntimeView extends McpServerView {
    source?: McpRowSource;
    fiberPhase: FiberPhaseView;
    skipReason: string | null;
    toolCount: number;
}
/** 一个项目的文件级状态（snapshot() 用）。 */
export interface ProjectFileState {
    project: string;
    path: string;
    ok: boolean;
    error: string | null;
    servers: McpServerRuntimeView[];
    /** 分区作用域：workspace=项目层文件，global=用户层文件。缺省 workspace。 */
    kind?: "workspace" | "global";
    /** 该分区的配置来源方言。 */
    source?: McpRowSource;
}
export interface ProjectMcpRegistryOptions {
    /** 全局（profile patch）已装载 mcp-client 行的 serverName，用于生效名冲突判定。 */
    globalNames: () => Promise<string[]>;
    /** 生效名冲突时优先保留原名的项目键（`projectKeyOf` 规范化后的项目根）。
     *  同一原始名有多个命中时按配置列表顺序第一个保留原名，其余仍命名空间化；
     *  全局行占用的名字不会被项目行复用。缺省空集 = 全部按旧规则改名。 */
    keepRawNameKeys?: () => Iterable<string>;
    /** 当前运行的 profile 名（决定读哪个 `profiles/<name>/mcp.json`）；解析不出返回 undefined。 */
    activeProfile?: () => Promise<string | undefined>;
    /** 用户层路径注入点（测试用）；缺省 `<dshHome>/mcp.yml`、`<dshHome>/mcp.json`、`<dshHome>/profiles`
     *  （dshHome = `$DSH_HOME` 或 `<home>/.dsh`，见 dsh-paths.dshHomeDir）。 */
    userLayerPaths?: Partial<UserLayerPaths>;
    /** 时钟（测试注入）；缺省 `Date.now`。 */
    now?: () => number;
    /** 健康重挂退避毫秒；缺省 `HEALTH_REMOUNT_BACKOFF_MS`。 */
    healthRemountBackoffMs?: number;
    /** 健康重挂次数上限；缺省 `HEALTH_REMOUNT_LIMIT`。 */
    healthRemountLimit?: number;
    /** fail-closed 兜底的链外重试退避（测试注入）；缺省 `FALLBACK_RETRY_DELAYS_MS`。 */
    fallbackRetryDelaysMs?: number[];
    /** 配置文件指纹（测试注入）；缺省 `fs.stat`。返回 `null` 视为缺失。 */
    statFile?: (path: string) => Promise<{
        mtimeMs: number;
        size: number;
    } | null>;
    /** 工具预算告警阈值（测试注入）；缺省读 `DSH_MCP_TOOL_BUDGET_WARN`。 */
    toolBudget?: {
        maxTools: number;
        maxBytes: number;
    };
    /** 打开配置文件的宿主动作（配套 UI 的「打开配置文件」按钮）；缺省时该按钮不可用。 */
    openPath?: (path: string) => void | Promise<void>;
    /**
     * 在线会话目录的补扫间隔（毫秒）。`agent/created` 若被作用域过滤掉，
     * 靠它在运行中发现新工作区。`0` 或未设置则不启定时器（测试缺省关闭）。
     */
    liveWatchMs?: number;
}
/** 变更计划（纯函数，供测试）。 */
export interface DesiredProjectRow {
    rawName: string;
    row: PatchRow;
    source?: McpRowSource;
}
export interface ProjectChangePlan {
    toUnmount: string[];
    toMount: DesiredProjectRow[];
}
/** 行的原始 serverName（受管行 id 或 config.serverName）；实现在 model.ts，CLI 与装载同口径。 */
export { rowNameOf } from "./model.js";
/**
 * 计算一个项目应当执行的装载变更（纯函数）：
 *   toUnmount —— 已装载但已不存在 / 生效名变化 / 配置变化的 rawName；
 *   toMount   —— 尚未装载或需要按新行/新生效名重新装载的条目。
 */
export declare function planProjectChanges(current: {
    rawName: string;
    effectiveName: string;
    row: PatchRow;
}[], desired: DesiredProjectRow[], effective: Map<string, string>, projectKey: string): ProjectChangePlan;
/** 项目根下原生受管块文件路径。 */
export declare function projectMcpFile(projectRoot: string): string;
/** 项目根下 DSH 自有 JSON 配置文件路径（`<root>/.dsh/mcp.json`）。 */
export declare function projectDshJsonFile(projectRoot: string): string;
/** 项目根下 CC project scope 兼容文件路径（只读）。 */
export declare function projectMcpJsonFile(projectRoot: string): string;
/**
 * 项目 watcher 允许打开的路径：项目根、`.dsh`，以及三个配置文件。
 * chokidar 5 调用 `ignored` 前会把路径收成正斜杠，比对必须再走 `normalizePathKey`。
 */
export declare function projectConfigWatchKeys(roots: readonly string[]): Set<string>;
/** 全局（用户层）装载的作用域键：参与 skipReasons 与日志归因。 */
export declare const GLOBAL_SCOPE_KEY = "\0global";
/** 连续重挂次数上限：工具恢复后清零；达到后写 `give-up` 诊断并停止。 */
export declare const HEALTH_REMOUNT_LIMIT = 3;
/** 0 工具去抖与两次重挂之间的缺省退避（毫秒）。测试可经 options 注入 0。 */
export declare const HEALTH_REMOUNT_BACKOFF_MS = 5000;
/** fail-closed 兜底的链外重试退避；用尽后保留保护通知，等手动触发恢复。 */
export declare const FALLBACK_RETRY_DELAYS_MS: number[];
/** 被身份/归一名去重剔除的行：loser 原名、winner 原名、命中维度、两侧来源。
 *  来源字段用于归因过滤：纯用户层之间的冲突不该记到每个项目的诊断里。 */
export interface IdentityShadow {
    name: string;
    winner: string;
    reason: "identity" | "normname";
    /** 被剔除方（loser）的来源层。 */
    source: McpRowSource;
    /** 胜出方（winner）的来源层。 */
    winnerSource: McpRowSource;
}
/** 用户层之间被同名/同服务遮蔽的行（全局层内部冲突，按全局归因）。 */
export interface GlobalShadow {
    name: string;
    winner: string;
    source: McpRowSource;
    winnerSource: McpRowSource;
}
/**
 * 多来源行按优先序合并（数组顺序=优先序，先到先得；后到重复行为被遮蔽）。
 * 三把遮蔽键同时先到先得：精确原名、归一名（normalizedNameKey）、服务身份
 * （serviceIdentityKey）。disabled 占名行照样注册三键——给低层行提供
 * 「占名退出」手段，但本身不进 rows。
 * shadowedOwnCc：被项目 yml 遮蔽的项目 .mcp.json 行；shadowedUser：被任一项目
 * 自身行遮蔽的用户层行（含身份/归一名命中）；shadowedGlobal：被另一条用户层行
 * 遮蔽的用户层行；shadowedIdentity：被归一名或身份键去重剔除的行明细（带两侧
 * 来源，供归因过滤）。纯函数，供测试。
 */
export declare function mergeSourcedRows(candidates: SourcedRow[][]): {
    rows: DesiredProjectRow[];
    shadowedOwnCc: string[];
    shadowedUser: string[];
    shadowedGlobal: GlobalShadow[];
    shadowedIdentity: IdentityShadow[];
};
export interface DiagUnhealthy {
    name: string;
    reason: string;
}
/** 对账结束后写入诊断文件的摘要段（`.mcp-diag.json` 的 `summary`）。 */
export interface DiagSummary {
    at: string;
    projects?: number;
    rows: number;
    mounted: number;
    skippedByReason: Record<string, number>;
    unhealthy: DiagUnhealthy[];
    /**
     * 只读兼容：仅旧版诊断文件（按需挂载时代的宽限卸载）可能带这一项，当前实现
     * 不再产生；`dsh-mcp status` 仍会为旧文件打印。不要新增写入方。
     */
    idle?: string[];
    toolBudget?: {
        name: string;
        tools: number;
        bytes: number;
    }[];
}
export interface DiagDocument {
    summary?: DiagSummary;
    events: Record<string, unknown>[];
    /** 项目诊断才有：这份文件对应的项目根。全局诊断不写。 */
    project?: string;
}
/** 兼容旧版纯数组诊断文件：数组 → `{ events }`；对象取 `summary` + `events`。 */
export declare function parseDiagDocument(raw: unknown): DiagDocument;
/** 添加对话框的三个写入位置。项目层的 projectRoot 是当前工作区，其余为空串。 */
export interface McpWriteTarget {
    id: "project" | "user" | "profile";
    source: "dsh-project" | "dsh-user-yml" | "dsh-profile-user-yml";
    projectRoot: string;
    path: string;
}
/** 添加对话框收集的字段。cwd 由写入位置决定：项目层 "."，用户层与 profile 层空串。 */
export interface McpAddDraft {
    serverName: string;
    mode?: McpLoadingMode;
    transport: "stdio" | "streamable-http";
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
}
/**
 * 项目级 MCP 注册表：文件监听、装载/卸载、按会话 deny 重扫、状态快照。
 */
export declare class ProjectMcpRegistry {
    private readonly ctx;
    private readonly providers;
    /** projectKey → 项目条目（含已装载服务器）。 */
    private readonly projects;
    /** 全局（用户层）已装载服务器：rawName → state，宿主级只挂一条。 */
    private readonly globalServers;
    /** projectKey → 被该项目自身行遮蔽的全局行原名（按会话 deny 用）。 */
    private readonly suppressedGlobals;
    /** projectKey → 最近一次生效名目录（key = projectKey + "\0" + rawName）。 */
    private effective;
    /** agent id → 其会话项目 key（undefined 表示无项目）。 */
    private readonly agentProjects;
    private applyingRestrictions;
    /** agent id → 当前 restrict 的 disposer。 */
    private readonly restrictions;
    /** 处于 fail-closed 兜底的会话：agent id → 成因与链外重试状态。成功 sweep 或释放 agent 时清除。 */
    private readonly restrictionFallbacks;
    private watcher?;
    private watchedFiles;
    /** 用户层 watcher 当前盯的精确文件路径集合。 */
    private userWatcher?;
    private userWatchedPaths;
    /** 装载被跳过的行（key\0rawName → 原因）；快照按独立 skipReason 字段展示，fiberPhase 保持枚举。 */
    private readonly skipReasons;
    /** 最近一次用户层读取结果（reconcile 与 snapshot 共享；首轮 reconcile 前为空）。 */
    private userLayer;
    /** 当前 profile 名（activeProfile provider 的最近一次解析结果）。 */
    private activeProfileName;
    private reconcileCount;
    /**
     * `reconcileAll` 正在执行。fiber 若在这期间 settle，收尾那一次 `emitUpdated`
     * 已经能读到新 phase，不必再发。对账结束后才 settle 的，要另发一次，否则
     * 设置页会停在「正在启动」，直到关掉重开。
     */
    private reconciling;
    /** identity 去重告警/诊断的变更门控：projectKey → 上次对账的剔除集签名。 */
    private readonly identityShadowSigs;
    /**
     * 告警变更门控：门控键 → 上次告警的签名。签名不变就沉默——否则任何文件事件
     * 都会让每类告警重刷一遍（规模 = 对账次数 × 项目数 × 坏条目数）。
     * 键前缀区分关注点：`entries\0<path|projectKey>`、`blocked\0global`、`gshadow\0global`。
     */
    private readonly warnGates;
    private timer;
    private chain;
    private disposed;
    /** 配置文件读取次数（scan / 用户层；测试用指纹跳过断言）。 */
    private configReadCount;
    /** 上一轮对账入口的配置文件指纹；全同则跳过重读。 */
    private lastFingerprintSig;
    /** watcher 文件事件代数：agent/巡检触发的对账可跳过重读，文件事件必须重读。 */
    private configEpoch;
    private lastFingerprintEpoch;
    /** 上一轮 scanProject 的期望行（指纹未变时复用；摘要 rows 也按这份目录计）。 */
    private lastScanDesired;
    /**
     * 上一轮扫描的分文件目录（snapshot / serverView 的内存拼装；含被遮蔽行与
     * entryErrors）。与 lastScanDesired 同生命周期，随 prunePerProjectState 剪。
     */
    private readonly lastScanFiles;
    /** 上一轮用户层合并后的全局期望行（摘要按目录计，不按当前装载 Map）。 */
    private lastGlobalDesired;
    private globalCatalogScanned;
    /** 装载行的健康巡检内存（unmount 会删掉 ProjectServerState，不能只挂在 state 上）。 */
    private readonly healthByMount;
    /** 作用域键 → 超预算的生效名（写入 diag summary；每轮重算）。 */
    private readonly toolBudgetHits;
    /** session id → 该会话 cwd 解析出的项目根。session/created 先于 agent 入列时也要能装载。 */
    private readonly sessionRoots;
    /** 当前工作区仅用于管理页展示和写入目标。 */
    private foregroundKey;
    /** 已解析过的 cwd / 项目根 → projectKey。session/event 上同步切焦点，不等再次走盘。 */
    private readonly cwdKey;
    /** projectKey → 解析时的项目根。焦点可以落在还没有配置文件的工作区上。 */
    private readonly projectRoots;
    /** 上一轮对账结束时的在线目录签名；补扫发现变化才再对账。 */
    private liveWatchSig;
    private liveWatchTimer;
    /**
     * 用户已经用消息选定工作区。冷启动那一轮校正之后也不再改写。
     */
    private userChoseFocus;
    /** 冷启动校正已经做过，或用户已经点开工作区。之后不再用宿主可见会话改写焦点。 */
    private hostFocusSealed;
    /** 构造时已经在线的 agent。它们随后的 agent/created 是冷启动重放，不改焦点。 */
    private readonly startupAgentIds;
    /** 生效名 → 尚未结束的 fiber.dispose。同名重挂必须等它落地，避免预留被晚到的 dispose 清掉。 */
    private readonly nameRelease;
    private disposeLazyTools?;
    private readonly closedLazySessions;
    /** 上一次推送的 MCP 上下文占用签名（工具定义 + 调用结果）；只在真正变化时补发。 */
    private lastContextUsageSignature;
    /** 最近一次用户消息所在会话 id（仅顶层会话）；无参占用查询优先选它，而不是枚举最后一个。 */
    private activeSessionId?;
    /** 会话对象 → 该 seq 时算好的结果占用；只在日志长度变化后重算。 */
    private readonly resultCostCache;
    constructor(ctx: any, providers: ProjectMcpRegistryOptions);
    private disposeRuntime;
    private disposeRestrictions;
    private disposeServerFibers;
    private disposeMountedFibers;
    private enqueue;
    /**
     * 后台入队（fire-and-forget）：所有不 await 的入队都走这里。`enqueue` 的链尾
     * （`this.chain = run.then(...)`）本就替 `run` 挂了 rejection 处理器，所以丢弃
     * 返回值不会炸进程；但那样失败就完全不可见。这里保留返回值并记一条 warn，
     * 让「对账/巡检没跑成」这类问题留得下痕迹。
     * 与 `enqueueDiag` 的分工：诊断落盘是最佳努力，失败只静默（见 enqueueDiag）。
     */
    private schedule;
    private kick;
    /**
     * 变更门控告警：签名与上次相同则不 emit；空签名表示「该 scope 无异常」，清掉门控
     * （下次再出现同样的问题仍会告警一次）。
     */
    private warnGated;
    private liveAgents;
    /** 运行中补扫在线目录。测试不传 `liveWatchMs`，避免定时器改写对账次数。 */
    private armLiveWatch;
    private sessionIdOf;
    private releaseLazySession;
    private rememberSession;
    private waitForVisibleEager;
    private hasPendingVisibleEager;
    private hasPendingEager;
    private prepareAgent;
    private rememberAgent;
    /** 记下 cwd 与项目根对应的 projectKey，供 session/event 同步切焦点。 */
    private rememberCwdKey;
    /**
     * 添加对话框要写到的工作区。有焦点时用焦点；还没有焦点、但只见过一个工作区时用那一个
     * （热重载后、下一条用户消息到来前）。多个工作区又没有焦点时不猜测。
     */
    focusedProjectRoot(): string | undefined;
    /** 用户消息更新管理页焦点。首次见到的目录还需要发现配置。 */
    private onSessionActivity;
    /**
     * 记录最近的顶层活动会话，供无参占用查询优先选用。只有真正的用户回合才挪：
     * 子代理的活动、以及压缩注入的 surface-replace（同样是 user/message）都不能
     * 把选择从真实会话上抢走。返回活动会话是否真的变了。
     */
    private recordActiveSession;
    /** 把 fiber.dispose 串到该生效名的释放链上。后一次同名挂载会等到整条链结束。 */
    private releaseFiber;
    /** 等到这个生效名上没有未完成的 dispose。等待期间新挂上的也要等完。 */
    private waitForNameRelease;
    /**
     * 冷启动用的可见工作区。只读会话列表上的当前选中项。
     * `sessions.current()` 在恢复过程中指向正在恢复的会话，不能拿来校正焦点。
     */
    private hostVisibleCwd;
    private hostSessionList;
    private liveSessionCwds;
    /** 多个会话同时恢复时，可见工作区不一定是最后一条 agent/created。只在冷启动那一轮调用。 */
    private alignForegroundToHost;
    /** 在线 agent cwd、session/created 记下的根、进程 cwd。排序后比较，发现新工作区。 */
    private liveDirectorySignature;
    private knownProjects;
    private syncWatcher;
    /** 用户层三个来源文件路径：缺省跟随 dshHome（`$DSH_HOME` 优先），注入项逐键覆盖。 */
    private resolveUserLayerPaths;
    /** 原生受管块文件通用读取（项目 yml 与用户层 yml 共用）。 */
    private readNativeRows;
    /**
     * 读用户层三个来源并刷新缓存：profile JSON（profile 名可解析时）、用户 yml、用户 JSON。
     * 坏条目/文件级错误只告警（无项目归属，不进逐项目 diag）。
     */
    /**
     * 当前 profile 名，并挡下不能安全拼进 profiles 目录的值：`DSH_MCP_PROFILE`
     * 是外部输入，`../../somewhere` 会让 join 读到 profiles 目录之外。
     * 不合法按「解析不出」降级（不读 profile 层），并按门控告警一次。
     */
    private resolveActiveProfileName;
    private readUserLayer;
    /**
     * 一个配置文件的文件级错误 + 坏条目告警（门控：集合不变则沉默）。
     * gateKey 只用于门控归属（不出现在文案里），label 是完整的告警前缀。
     */
    private warnFileIssues;
    /** 非法 glob 仍装载该行，但告警一次：matchToolGlob 会把编译失败当成永不命中。 */
    private warnInvalidToolGlobs;
    /**
     * 监听用户层具体文件（与项目层的精确路径过滤同构；不监视家目录递归：
     * 探针实测 chokidar v5 盯「父目录已存在的缺失文件」能在创建时补发 add，而盯
     * 不存在的目录则永久瞎——具体文件路径是更稳的监听形态）。
     */
    private syncUserWatcher;
    /** close 卡住时不能堵死对账链：新工作区的装载已经在前面完成。 */
    private closeWatcher;
    private noteConfigRead;
    private nowMs;
    private remountBackoffMs;
    private remountLimit;
    private statConfigFile;
    /** 已知项目的 3 个配置路径 + 用户层 3 路径（及对方全局文件）的 mtimeMs+size 指纹。 */
    private configFingerprintSignature;
    private shouldSkipConfigReread;
    /**
     * 全量对账：重算项目集合 → 读全部项目文件 → 计算生效名 → 逐项目装载/
     * 卸载 → 重扫各会话 deny。文件事件、新 agent、插件热更都汇到这里。
     * 成功结束时 emit `projectMcp/updated`（无载荷）；中途退出或抛错不发。
     * fiber 若在对账结束后才变为 active/failed，再发一次（见 emitMountSettled）。
     */
    reconcileAll(): Promise<void>;
    /** 对账正文。成功才 emit；抛错时调用方清掉 `reconciling`，事件不发。 */
    private reconcileAllInner;
    private mountedEagerNames;
    /** 项目扫描和缓存提交保持原有顺序；跳过重读时不提交新的指纹。 */
    private collectDesiredProjects;
    /** 监听失败不影响本轮已完成的装载，也不阻止成功事件。 */
    private refreshWatchersAfterReconcile;
    /**
     * 快照可能变了：宿主监听后再读 `snapshot()`。无载荷、不带 diff。
     * 对账成功结束发一次；装载 fiber 在对账结束后才 settle 时再发一次。
     * 浏览器 SSE 仍由配套 UI 自建。监听方抛错只记一条 warn，不让对账失败。
     */
    private emitUpdated;
    /** 对账已经结束才把 phase 写成 active/failed 时补一次推送。对账进行中不发，收尾那一次已经覆盖。 */
    private emitMountSettled;
    /** 订阅快照变更（对账结束，以及其后的装载 settle）。返回退订函数。 */
    subscribeUpdated(listener: () => void): () => void;
    /**
     * 单个项目的扫描：读三个项目层来源 → 与用户层行合并 → 记诊断/告警 → 返回该项目
     * 的期望行。项目侧压制集合（suppressedGlobals）在这里落库，只收「本轮真会全局
     * 装载的名字」。
     */
    private scanProject;
    /**
     * 项目层同服务剔除的告警 + 变更门控：剔除集与上次一致就沉默——否则任何文件
     * 事件都会让每个已知项目各刷一遍同样的告警（规模 = 对账次数 × 项目数 × 重复
     * 行数）。返回 shadowChanged 供 scan 诊断写入条件（buildScanDiag）使用。
     */
    private warnIdentityShadows;
    /**
     * 用户层内部遮蔽的全局归因：同名（shadowedGlobal）与同服务/归一名
     * （shadowedIdentity 的两侧都是用户层）都只告警一次并写全局诊断。
     * 此前同名遮蔽零可见性、同服务遮蔽按项目重复归因。
     */
    private reportGlobalShadows;
    /** 逐项目状态表按本轮已知项目剪枝（projects 的保留是有意为之，见 reconcileProject）。 */
    private prunePerProjectState;
    private isStaleProjectFileGate;
    /**
     * 告警门控按已知项目剪：`entries\0` / `globs\0` 里带项目键的前缀、以及已不在
     * 装载集里的 `budget\0<effectiveName>`。用户层路径门控与 profile 名门控保留。
     */
    private pruneWarnGates;
    private reconcileProject;
    /** 全局（用户层）对账：与项目数量无关，宿主级只挂一条连接。 */
    private reconcileGlobals;
    private globalMountContainer;
    private projectContainer;
    /** 装载容器的通用对账（项目层与全局层共用）：算变更计划 → 卸载 → 装载。 */
    private reconcileContainer;
    private diagHome;
    private writeDiag;
    /** 全局诊断落 dshHome 根（与用户层 mcp.yml 同目录：注入 userLayerPaths 时同样跟随注入值）。 */
    private writeGlobalDiag;
    /** 删掉曾经写进工作区的诊断和它的锁。配置文件不动。 */
    private removeLegacyProjectDiag;
    private writeDiagAt;
    /** 跳过标记全部按故障/跳过原因计入摘要；`idle` 已不再产生（见 `DiagSummary.idle`）。 */
    private collectSkipMarks;
    private summarizeScope;
    private writeSummaries;
    /** 装载一个期望行；返回跳过原因（有则不建装载实例），undefined = 已发起装载。 */
    private mountServer;
    /**
     * 期望行 → dsh-mcp-client 配置。返回 `{ skip }` 表示已记诊断、不发起装载；
     * 行本身读不出或展开后仍不合法则抛出，由 mountServer 落 config-invalid。
     */
    private buildServerConfig;
    /** 登记装载中状态，并把 fiber 的 settle 结果回写到状态、诊断与会话过滤。 */
    private trackMount;
    /**
     * 诊断写排回 reconcile 链：fiber settle 的回调不在链上，裸写会与对账的
     * read-modify-write 交叉丢行。诊断是最佳努力——失败静默，不升级成 warn。
     */
    private enqueueDiag;
    private unmountServer;
    private healthKey;
    private healthOf;
    /**
     * 连接死亡自愈：当前 fiber 世代曾经有过工具、当前 0 工具持续超过退避窗口、未 disabled
     * → unmount 再 mount（新世代清 everHadTools，不抢官方内部重连）。
     * 单次 `mcpToolCount === 0` 边沿不拆连接（同世代 list_changed 清空再填回）。
     * 工具重新出现时清 remountCount / givenUp：give-up 表示连续失败，不是寿命配额。
     * 已重挂过、新世代仍长时间 0 工具则累加失败世代（仍不拆官方首连窗口），满上限 give-up。
     */
    private remountUnhealthy;
    private recoverMountHealth;
    private remountDeadFiber;
    private noteZeroToolsGeneration;
    private remountUnhealthyIn;
    private maybeRemountZeroTools;
    private markGiveUp;
    private inspectToolBudgets;
    private kickSweep;
    private visibleLazyMounts;
    private syncLazyProxies;
    private appendLazyProxyDenies;
    private refreshAgentProjects;
    private clearClosedWorkspaceFocus;
    private sweepRestrictions;
    private projectOf;
    private hiddenServersFor;
    /** 本会话可见的服务器上，条目 tools.allow/deny 展开成已注册工具名。 */
    private appendFilterDenies;
    private toolFilterDeniesForSession;
    /** 装载中的工具可能已注册，卸载中的工具可能尚未注销。两者都参与隔离。 */
    private projectMountGroups;
    /** 宿主工具层当前注册的全部工具 id；取不到时按空集（本轮不新增限制，下次 sweep 补）。 */
    private registeredToolIds;
    private applyRestriction;
    /** Agent scope 可能未声明 tools 依赖，优先经 ctx.get 取。 */
    private agentTools;
    /** 释放旧限制；agent 层已销毁时 disposer 可能失效，吞错。 */
    private disposeRestriction;
    /** fail-closed 兜底：临时 deny 全部已注册 MCP 工具；兜底也失败只能等下一次 sweep。 */
    private applyFailClosedRestriction;
    private fallbackRetryDelays;
    /** 记录兜底状态：升级日志、写全局诊断、链外退避重试。对账链可能正卡在慢 dispose，重试不能排队等它。 */
    private enterRestrictionFallback;
    private clearRestrictionFallback;
    private releaseAgent;
    /**
     * 会话项目 key：会话 cwd 的项目根；子代理无 cwd 时回退 owner 的项目；
     * 均无时回退 dsh 进程 cwd 所在项目。
     */
    private resolveProject;
    /** 立即执行一次全量对账（供外部在写入文件后调用，不等 watcher）。 */
    reconcileNow(): Promise<void>;
    /** 已执行的 reconcile 次数（测试用：验证文件事件是否惊动管线）。 */
    get debugReconcileCount(): number;
    /** 配置文件读取次数（测试用：指纹未变时不应再增长）。 */
    get debugConfigReadCount(): number;
    /** 健康巡检记录（测试用：断言恢复后 remountCount / givenUp 清零）。 */
    debugHealth(projectRoot: string, rawName: string): {
        everHadTools: boolean;
        remountCount: number;
        nextRemountAt: number;
        givenUp: boolean;
    } | undefined;
    /** 等待某项目某行的装载状态满足 predicate（写入后 reconciliation 用）。 */
    waitForState(projectRoot: string, rawName: string, predicate: (state: ProjectServerState | undefined) => boolean, timeoutMs?: number): Promise<boolean>;
    /** 全局（用户层）某行的装载状态；未装载返回 undefined。 */
    globalState(rawName: string): ProjectServerState | undefined;
    /**
     * 某个会话可见的 MCP 工具定义占多少上下文（token 为 DSH token-meter 口径的估算）。
     *
     * 只读内存：取该会话可见的工具 schema 与最近一次请求的上下文窗口，
     * 不读盘、不驱动对账。会话不存在（还没建、已销毁）时返回零值，
     * 调用方用 `sessionId === null` 区分「没有会话」与「有会话但没有 MCP」。
     * 代码模式（PTC）会话返回 `unsupported: "code-mode"`，不按 schema 硬算。
     */
    contextCost(sessionId?: string): McpContextCost;
    /**
     * 某个会话当前仍保留的 MCP 工具调用结果占多少上下文（token 为 DSH
     * token-meter 口径的逐条消息估算）。
     *
     * 只读内存：读该会话当前的模型可见消息（`session.deriveMessages()`），
     * 不读盘、不驱动对账。被裁剪或压缩掉的结果已不在 surface 上，不计。
     * Eager 结果按 `mcp__<生效名>__` 归属；Lazy 结果按代理参数里的 `server`
     * 归属，`mcp_search` 未指定服务器时归入共享代理组。
     * 代码模式（PTC）会话返回 `unsupported: "code-mode"`，结果嵌在 run_code 内无法归属。
     */
    resultCost(sessionId?: string): McpResultCost;
    /** 指定会话，或当前活动会话；都找不到时退回焦点工作区里最近的那个会话。 */
    private contextCostAgent;
    /** 焦点工作区里最近的会话；还没定焦点时取在线会话里最后一个。 */
    private focusedCostAgent;
    /** 宿主当前选中的会话 id（`sessions.list()` 的 current 项）；不可用时 undefined。 */
    private hostCurrentSessionId;
    /**
     * 该会话最近一次请求是否走代码模式（PTC）执行器。`run_code` 是宿主保留名，
     * 请求头工具列表里出现它即判定为代码模式；还没有请求头时按原生口径估算，
     * 首次请求后即自我纠正。只读请求头，不触碰执行器私有接口。
     */
    private isCodeModeAgent;
    /**
     * 该会话可见的工具 schema。优先用 agent 作用域：那里已经扣掉本插件的 deny
     * 与条目 allow/deny；作用域取不到时退回全局工具层（Eager 可能偏大），
     * 但仍扣除本项目不可见的 Lazy 代理，不按配置数量合成 schema。
     */
    private schemasForAgent;
    /**
     * 该会话当前的模型可见消息。`deriveMessages()` 是 Session 的公开读法，
     * 自带缓存、按 surface 顺序返回（压缩/裁剪后的内容已经生效）。
     * 会话对象或读法不可用时返回空数组，不把异常抛给查询方。
     */
    private messagesForAgent;
    private contextWindowOf;
    /** 已装载服务器的生效名：工具名归属按最长前缀匹配，生效名本身可能含 `__`。 */
    private knownEffectiveNames;
    /** 定义或结果占用签名变了才补发一次 `projectMcp/updated`，让页面重读抬头标签。 */
    private emitContextUsageIfChanged;
    /** 等待全局层某行的装载状态满足 predicate。 */
    waitForGlobalState(rawName: string, predicate: (state: ProjectServerState | undefined) => boolean, timeoutMs?: number): Promise<boolean>;
    /** 行级 view 的逐层影子优先查找：项目 yml > 项目 .dsh/mcp.json > .mcp.json > profile yml > profile json > 用户 yml > 用户 json > 装载残留态。只读内存目录。 */
    private locateRowFromMemory;
    private locateProjectRowFromMemory;
    private locateUserRowFromMemory;
    /** 行级 view；未装载时 phase 按行状态推导。行查找按影子优先序走内存目录。 */
    serverView(projectRoot: string, rawName: string): Promise<McpServerRuntimeView | undefined>;
    private serverViewFromMemory;
    /** 内存快照：进 enqueue 与对账互斥，不读盘、不触发对账。要收敛请走 `reload()` / `reconcileNow()`。 */
    snapshot(): Promise<ProjectFileState[]>;
    /**
     * 一条服务器行对应的原生受管 yml 路径（该作用域的权威写入文件）：
     * 项目层 → `<projectRoot>/.dsh/mcp.yml`；profile 层 → `profiles/<name>/mcp.yml`；
     * 其余用户层 → `~/.dsh/mcp.yml`。文件可以尚不存在（创建语义）。
     */
    private managedYmlPathFor;
    /** 该行的受管 yml 路径；解析不出 profile 名时返回 undefined。遗留 `.mcp.json` 指向同项目的 `.dsh/mcp.yml`。 */
    managedPathFor(source: McpRowSource, projectRoot: string): string | undefined;
    /**
     * 返回受管 yml 的绝对路径。文件尚不存在时按空受管块创建，这样资源管理器
     * 才能选中它，而不是打开一个对不上的默认窗口。
     */
    prepareManagedYml(source: McpRowSource, projectRoot: string): Promise<string>;
    /** 锁内读-改-写该作用域的受管 yml；写完排一次对账（不等待对账结束）。 */
    private editManagedYml;
    /** 在受管 yml 里找到目标行：优先同名，其次同服务身份（接管 JSON 层时身份一致才算同一条）。 */
    private findManagedRowIndex;
    /**
     * 添加对话框能写的受管 yml。项目层只给出当前工作区（没有配置文件也给出）；
     * 用户层始终给出；profile 层仅在解析得出当前 profile 名时给出。
     */
    writeTargets(): McpWriteTarget[];
    /** 表单确认后追加一条受管 yml 行（没有文件就创建）。同名已存在则拒绝，不改文件。 */
    addServer(source: McpRowSource, projectRoot: string, draft: McpAddDraft): Promise<string>;
    /** 七层来源落到哪一个写入位置。项目层三条都写工作区 mcp.yml，profile 两条写 profile mcp.yml。 */
    private writeSlot;
    /** 只接受当前 writeTargets() 里的位置，避免把行写到一个已经不是焦点的工作区。 */
    private assertWritableTarget;
    /** 内存目录里某一层的同名行。不跨层回退：调用方要改的是这一张卡，不是更高优先级的另一条。 */
    private locateRowBySource;
    /** 写操作要改的那一行。来源不在可写位置，或这一层没有这个名字，都在改文件之前拒绝。 */
    private requireSourceRow;
    /** 项目扫描目录加用户层四份文件。供按来源查找，以及判断受管 yml 下面是否还有同名或同身份行。 */
    private layeredRows;
    /**
     * 受管 yml 删除后，更低层是否还会把同名或同一服务装回来。
     * 优先序数字更大的才是低层；profile 高于用户层，不能因为 profile 有同名就在用户文件里留占位。
     */
    private managedLayerOf;
    private lowerLayerCovers;
    private disabledTakeover;
    /** 启用/停用：yml 行就地翻 disabled；其它来源在受管 yml 里落一条同身份行（启用=完整拷贝，停用=disabled 占位）。 */
    setServerEnabled(source: McpRowSource, projectRoot: string, rawName: string, enabled: boolean): Promise<string>;
    /**
     * 删除：受管 yml 是这条服务的唯一来源时摘掉该行。
     * 低层还有同名或同一服务身份时留下 disabled 占位，避免摘掉占位后下层再次启动。
     * 其它来源第一次删除则在受管 yml 里落一条占位，不改原文件。
     */
    removeServer(source: McpRowSource, projectRoot: string, rawName: string): Promise<string>;
    setLoadingMode(source: McpRowSource, projectRoot: string, rawName: string, mode: McpLoadingMode): Promise<string>;
    /** 单个工具的可见开关：写入该作用域受管 yml 行的 tools.allow/deny（deny 优先；全开时删除 tools 键）。 */
    setToolEnabled(source: McpRowSource, projectRoot: string, rawName: string, tool: string, enabled: boolean): Promise<string>;
    /** 一台服务器当前已注册的工具名（短名）与逐项可见性；未装载/无工具时返回空列表。 */
    toolStates(projectRoot: string, rawName: string): {
        name: string;
        enabled: boolean;
    }[];
    /** 打开该作用域的受管 yml（经注入的 openPath；未注入时报错由 UI 呈现）。 */
    openConfigFile(source: McpRowSource, projectRoot: string): Promise<string>;
    private pushYmlSnapshot;
    private pushJsonLayerSnapshot;
    private pushGlobalSnapshot;
    private buildSnapshotFromMemory;
    /** 一个来源分区的服务器 view 列表；state 只认同来源装载实例（异来源=被遮蔽）。 */
    private partitionServers;
}

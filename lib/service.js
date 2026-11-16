/** cordis 服务名；经 `ctx.provide` / `ctx.get` / `ctx.projectMcp` 取用。 */
export const PROJECT_MCP_SERVICE = "projectMcp";
/**
 * 快照可能变化时发出的 cordis 事件名。无载荷。
 * 对账成功结束发一次；装载 fiber 在那之后才变为 active/failed 时再发一次。
 * 监听方再读 `snapshot()`；本包不打开浏览器 SSE。
 */
export const PROJECT_MCP_UPDATED_EVENT = "projectMcp/updated";
export function bindProjectMcpService(registry) {
    return {
        snapshot: () => registry.snapshot(),
        serverView: (projectRoot, rawName) => registry.serverView(projectRoot, rawName),
        globalState: (rawName) => registry.globalState(rawName),
        contextCost: (sessionId) => registry.contextCost(sessionId),
        resultCost: (sessionId) => registry.resultCost(sessionId),
        reload: () => registry.reconcileNow(),
        openConfigFile: (source, projectRoot) => registry.openConfigFile(source, projectRoot),
        setServerEnabled: (source, projectRoot, rawName, enabled) => registry.setServerEnabled(source, projectRoot, rawName, enabled),
        setLoadingMode: (source, projectRoot, rawName, mode) => registry.setLoadingMode(source, projectRoot, rawName, mode),
        removeServer: (source, projectRoot, rawName) => registry.removeServer(source, projectRoot, rawName),
        setToolEnabled: (source, projectRoot, rawName, tool, enabled) => registry.setToolEnabled(source, projectRoot, rawName, tool, enabled),
        toolStates: (projectRoot, rawName) => registry.toolStates(projectRoot, rawName),
        managedPathFor: (source, projectRoot) => registry.managedPathFor(source, projectRoot),
        prepareManagedYml: (source, projectRoot) => registry.prepareManagedYml(source, projectRoot),
        writeTargets: () => registry.writeTargets(),
        addServer: (source, projectRoot, draft) => registry.addServer(source, projectRoot, draft),
        subscribeUpdated: (listener) => registry.subscribeUpdated(listener)
    };
}

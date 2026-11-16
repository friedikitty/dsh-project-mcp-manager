import { scrubbedParentEnv } from "@deepseek-ai/dsh-subprocess";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { createRequire } from "node:module";
const { version } = createRequire(import.meta.url)("../../package.json");
const DISCOVERY_TIMEOUT_MS = 30_000;
/** Cancel one waiter without cancelling work shared by other callers. */
async function abortable(work, signal) {
    signal.throwIfAborted();
    let onAbort;
    const aborted = new Promise((_, reject) => {
        onAbort = () => reject(signal.reason);
        signal.addEventListener("abort", onAbort, { once: true });
    });
    try {
        return await Promise.race([work, aborted]);
    }
    finally {
        signal.removeEventListener("abort", onAbort);
    }
}
/** One on-demand connection per server and session. Never registers remote tools with DSH. */
export class LazyServer {
    config;
    connection;
    activated = false;
    closing = Promise.resolve();
    disposed = false;
    disposal;
    constructor(config) {
        this.config = config;
    }
    get isActivated() { return this.activated; }
    open() {
        const config = this.config;
        const transport = config.transport === "stdio"
            ? new StdioClientTransport({
                command: config.command,
                args: config.args,
                cwd: config.cwd || undefined,
                env: { ...scrubbedParentEnv(), ...config.env }
            })
            : new StreamableHTTPClientTransport(new URL(config.url), { requestInit: { headers: config.headers } });
        const client = new Client({ name: "dsh-project-mcp-manager", version }, {
            versionNegotiation: { mode: "auto" },
            listChanged: { tools: { autoRefresh: false, debounceMs: 0, onChanged: () => {
                        connection.catalog = undefined;
                    } } }
        });
        const abort = new AbortController();
        // The SDK can close fire-and-forget on handshake failure. Its stdio close()
        // clears the process handle before awaiting exit, so concurrent close calls
        // would otherwise appear finished while a process is still starting/exiting.
        const start = transport.start.bind(transport);
        const close = transport.close.bind(transport);
        let starting;
        let transportClosing = Promise.resolve();
        transport.start = () => starting = Promise.resolve().then(() => {
            abort.signal.throwIfAborted();
            return start();
        });
        transport.close = () => transportClosing = transportClosing.catch(() => { }).then(async () => {
            await starting?.catch(() => { });
            await close();
        });
        // Publish the generation before connect can settle or a transport callback runs.
        const connection = { client, transport, abort, ready: Promise.resolve(), requests: 0 };
        connection.ready = Promise.resolve().then(async () => {
            abort.signal.throwIfAborted();
            await client.connect(transport, { signal: abort.signal, timeout: DISCOVERY_TIMEOUT_MS });
            if (this.connection !== connection || this.disposed)
                throw new Error("The MCP connection closed");
        }).catch(() => {
            throw new Error("Unable to connect to the MCP server");
        });
        // Reap failed/closed generations even if every caller already cancelled.
        void connection.ready.catch(() => { void this.close(connection); });
        client.onclose = () => { void this.close(connection); };
        return connection;
    }
    async withClient(signal, use) {
        signal.throwIfAborted();
        if (this.disposed)
            throw new Error("The MCP server configuration changed");
        let closing;
        do {
            closing = this.closing;
            // This is a generation fence, not independent work: a newer shutdown can
            // replace the awaited promise. Never parallelize or skip this re-check.
            await abortable(closing, signal);
        } while (closing !== this.closing);
        signal.throwIfAborted();
        if (this.disposed)
            throw new Error("The MCP server configuration changed");
        const connection = this.connection ??= this.open();
        connection.requests++;
        try {
            await abortable(connection.ready, signal);
            signal.throwIfAborted();
            if (this.connection !== connection)
                throw new Error("The MCP connection closed");
            return await abortable(use(connection), signal);
        }
        finally {
            connection.requests--;
            if (connection.requests === 0 && !connection.discovered && this.connection === connection) {
                void this.close(connection);
            }
        }
    }
    listTools(connection) {
        if (connection.catalog !== undefined)
            return connection.catalog;
        const catalog = connection.client.listTools(undefined, {
            cacheMode: "refresh",
            signal: connection.abort.signal,
            timeout: DISCOVERY_TIMEOUT_MS
        }).then(({ tools }) => {
            connection.discovered = true;
            if (!this.disposed && this.connection === connection)
                this.activated = true;
            return tools;
        }).catch((error) => {
            if (connection.catalog === catalog)
                connection.catalog = undefined;
            throw error;
        });
        connection.catalog = catalog;
        return catalog;
    }
    callTool(connection, tool, args, signal) {
        if (this.connection !== connection)
            throw new Error("The MCP connection closed");
        if (tool.execution?.taskSupport === "required")
            throw new Error("This tool requires task-based execution");
        return connection.client.callTool({ name: tool.name, arguments: args }, {
            signal,
            timeout: this.config.toolCallTimeoutMs,
            toolDefinition: tool
        });
    }
    close(connection = this.connection) {
        if (connection === undefined)
            return this.closing;
        if (connection.shutdown !== undefined)
            return connection.shutdown;
        if (this.connection === connection)
            this.connection = undefined;
        // During SDK auto negotiation client.transport is still undefined. Closing the
        // original transport is what cancels the disposable stdio sibling probe.
        const closeTransport = () => (connection.client.transport === undefined
            ? connection.transport.close() : connection.client.close()).catch(() => { });
        connection.shutdown = Promise.resolve().then(async () => {
            connection.abort.abort();
            await closeTransport();
            await connection.ready.catch(() => { });
            // A connect racing the first close may have attached the transport meanwhile.
            await closeTransport();
        });
        this.closing = connection.shutdown;
        return connection.shutdown;
    }
    dispose() {
        this.disposed = true;
        this.disposal ??= this.close();
        return this.disposal;
    }
}
/** Own the independent connections opened by sessions for one mounted row. */
export class LazyConnections {
    config;
    sessions = new Map();
    closing = new Set();
    disposal;
    constructor(config) {
        this.config = config;
    }
    forSession(id, activate) {
        if (this.disposal !== undefined)
            return undefined;
        let server = this.sessions.get(id);
        if (server === undefined && activate) {
            server = new LazyServer(this.config);
            this.sessions.set(id, server);
        }
        return activate || server?.isActivated ? server : undefined;
    }
    release(id) {
        const server = this.sessions.get(id);
        if (server === undefined)
            return;
        this.sessions.delete(id);
        const closing = server.dispose();
        this.closing.add(closing);
        // 清理链自身不得产生未处理拒绝：dispose 的关闭屏障理论上不 reject，
        // 这里仍对两态都摘除集合元素，避免清理回调抛出时泄漏。
        const drop = () => this.closing.delete(closing);
        void closing.then(drop, drop);
    }
    dispose() {
        if (this.disposal !== undefined)
            return this.disposal;
        for (const id of this.sessions.keys())
            this.release(id);
        this.disposal = Promise.all(this.closing).then(() => { });
        return this.disposal;
    }
}

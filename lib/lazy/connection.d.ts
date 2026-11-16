import type { Config } from "@deepseek-ai/dsh-mcp-client";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
export type LazyTool = Awaited<ReturnType<Client["listTools"]>>["tools"][number];
interface Connection {
    client: Client;
    transport: StdioClientTransport | StreamableHTTPClientTransport;
    abort: AbortController;
    ready: Promise<void>;
    catalog?: Promise<LazyTool[]>;
    discovered?: boolean;
    requests: number;
    shutdown?: Promise<void>;
}
/** One on-demand connection per server and session. Never registers remote tools with DSH. */
export declare class LazyServer {
    private readonly config;
    private connection?;
    private activated;
    private closing;
    private disposed;
    private disposal?;
    constructor(config: Config);
    get isActivated(): boolean;
    private open;
    withClient<T>(signal: AbortSignal, use: (connection: Connection) => Promise<T>): Promise<T>;
    listTools(connection: Connection): Promise<LazyTool[]>;
    callTool(connection: Connection, tool: LazyTool, args: Record<string, unknown>, signal: AbortSignal): Promise<{
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            "io.modelcontextprotocol/serverInfo"?: {
                version: string;
                websiteUrl?: string | undefined;
                description?: string | undefined;
                icons?: {
                    src: string;
                    mimeType?: string | undefined;
                    sizes?: string[] | undefined;
                    theme?: "dark" | "light" | undefined;
                }[] | undefined;
                name: string;
                title?: string | undefined;
            } | undefined;
        } | undefined;
        content: ({
            type: "text";
            text: string;
            annotations?: {
                audience?: ("assistant" | "user")[] | undefined;
                priority?: number | undefined;
                lastModified?: string | undefined;
            } | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            type: "image";
            data: string;
            mimeType: string;
            annotations?: {
                audience?: ("assistant" | "user")[] | undefined;
                priority?: number | undefined;
                lastModified?: string | undefined;
            } | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            type: "audio";
            data: string;
            mimeType: string;
            annotations?: {
                audience?: ("assistant" | "user")[] | undefined;
                priority?: number | undefined;
                lastModified?: string | undefined;
            } | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            uri: string;
            description?: string | undefined;
            mimeType?: string | undefined;
            size?: number | undefined;
            annotations?: {
                audience?: ("assistant" | "user")[] | undefined;
                priority?: number | undefined;
                lastModified?: string | undefined;
            } | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
            icons?: {
                src: string;
                mimeType?: string | undefined;
                sizes?: string[] | undefined;
                theme?: "dark" | "light" | undefined;
            }[] | undefined;
            name: string;
            title?: string | undefined;
            type: "resource_link";
        } | {
            type: "resource";
            resource: {
                uri: string;
                mimeType?: string | undefined;
                _meta?: {
                    [x: string]: unknown;
                } | undefined;
                text: string;
            } | {
                uri: string;
                mimeType?: string | undefined;
                _meta?: {
                    [x: string]: unknown;
                } | undefined;
                blob: string;
            };
            annotations?: {
                audience?: ("assistant" | "user")[] | undefined;
                priority?: number | undefined;
                lastModified?: string | undefined;
            } | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        })[];
        structuredContent?: unknown;
        isError?: boolean | undefined;
    }>;
    private close;
    dispose(): Promise<void>;
}
/** Own the independent connections opened by sessions for one mounted row. */
export declare class LazyConnections {
    private readonly config;
    private readonly sessions;
    private readonly closing;
    private disposal?;
    constructor(config: Config);
    forSession(id: string, activate: boolean): LazyServer | undefined;
    release(id: string): void;
    dispose(): Promise<void>;
}
export {};

/** dsh 家目录重定位环境变量。 */
export declare const DSH_HOME_ENV = "DSH_HOME";
/** 显式指定 profile 名的环境变量（覆盖自动解析；CLI/无 profile 启动场景用）。 */
export declare const PROFILE_ENV = "DSH_MCP_PROFILE";
/** 原生受管块文件名（项目层 `<root>/.dsh/mcp.yml` 与用户层 `<dshHome>/mcp.yml` 同名）。 */
export declare const MCP_YML_FILE = "mcp.yml";
/** 项目/用户层配置目录名（项目层为 `<root>/.dsh`）。 */
export declare const DSH_DIR = ".dsh";
/** 全局诊断文件名（只写 `<dshHome>/`，不进用户工作区）。 */
export declare const DIAG_FILE = ".mcp-diag.json";
/** 项目诊断目录（`<dshHome>/mcp-diag/<hash>.json`）。 */
export declare const PROJECT_DIAG_DIR = "mcp-diag";
/**
 * dsh 家目录：`DSH_HOME` 非空则取其绝对化值，否则 `<home>/.dsh`。
 * 显式传入的 home 只影响缺省分支——注入方（测试/CLI `--home`）想完全接管路径时
 * 应直接给 dshHome。
 */
export declare function dshHomeDir(home?: string, env?: NodeJS.ProcessEnv): string;
/**
 * 注入优先的 dsh 家目录：显式给出的 home（CLI `deps.home`、测试注入）视为完整接管，
 * 直接取 `<home>/.dsh`；未给出时才解析 `DSH_HOME`。注入点若被 env 反超，注入就失去
 * 隔离意义（测试会读到真实用户配置）。
 */
export declare function dshHomeFor(home: string | undefined, env?: NodeJS.ProcessEnv): string;
/** 用户层（全局装载）三个来源文件的路径。 */
export interface UserLayerPaths {
    mcpYml: string;
    mcpJson: string;
    profilesDir: string;
}
/** dsh 家目录 → 用户层三个来源路径。 */
export declare function userLayerPathsIn(dshHome: string): UserLayerPaths;
/** profile 层 JSON 配置文件路径（`<dshHome>/profiles/<name>/mcp.json`）。 */
export declare function profileMcpJsonFile(profilesDir: string, profile: string): string;
/** profile 层原生受管块路径（`<dshHome>/profiles/<name>/mcp.yml`）；读取顺序高于该 profile 的 mcp.json。 */
export declare function profileMcpYmlFile(profilesDir: string, profile: string): string;
/**
 * 项目诊断文件：落在 dsh 家目录，不写进用户工作区。
 * 文件名是项目键的 sha256 前 16 位，Windows 上与路径大小写无关。
 */
export declare function projectDiagFile(dshHome: string, projectRoot: string): string;
/** 旧版项目诊断路径（`<projectRoot>/.dsh/.mcp-diag.json`）。只用于删掉已留下的文件。 */
export declare function legacyProjectDiagFile(projectRoot: string): string;
/** 对方插件全局存储路径（`$DSH_HOME/dsh-mcp.json`）；本插件不读取内容，只在存在时诊断。 */
export declare function foreignUserMcpJsonFile(dshHome: string): string;
/**
 * 合法 profile 名：字母数字开头，其后允许字母数字、`.`、`_`、`-`。
 * 用于把外部输入（`DSH_MCP_PROFILE`）挡在 profiles 目录内——`..`、
 * `../../somewhere`、绝对路径都会被拒。
 */
export declare const PROFILE_NAME_RE: RegExp;
/** profile 名是否可安全拼进 profiles 目录（显式拒绝 `.` 与 `..`）。 */
export declare function isValidProfileName(name: string): boolean;

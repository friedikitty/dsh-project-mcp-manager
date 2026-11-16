/** 判断文件系统路径是否存在。 */
export declare function pathExists(path: string): Promise<boolean>;
/** 项目锚点：向上找最近的含 .git 的祖先目录；找不到就退回 cwd 本身。 */
export declare function findProjectRoot(cwd: string): Promise<string>;

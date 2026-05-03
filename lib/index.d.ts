import { type ChangelogDebtConfig } from './config.js';
import { type Mode, type ScanResult } from './report.js';
export interface ScanOptions {
    base: string;
    head: string;
    cwd?: string;
    configPath?: string;
    configOverrides?: Partial<ChangelogDebtConfig>;
    mode?: Mode;
    eventPath?: string;
    modelPath?: string;
    since?: string;
    coverage?: string;
}
export declare function runScan(options: ScanOptions): Promise<ScanResult>;

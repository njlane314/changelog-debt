import { z } from 'zod';
export declare const TOOL_NAME = "changelog-debt";
export declare const VERSION = "0.1.1";
export declare const DEFAULT_CONFIG_PATH = ".github/changelog-debt.yml";
export declare const ConfigSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodEnum<{
        warn: "warn";
        fail: "fail";
    }>>;
    visible_change_paths: z.ZodDefault<z.ZodArray<z.ZodString>>;
    release_note_paths: z.ZodDefault<z.ZodArray<z.ZodString>>;
    docs_paths: z.ZodDefault<z.ZodArray<z.ZodString>>;
    satisfy_with_labels: z.ZodDefault<z.ZodArray<z.ZodString>>;
    waiver_labels: z.ZodDefault<z.ZodArray<z.ZodString>>;
    waiver_body_patterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
    max_findings: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type ChangelogDebtConfig = z.infer<typeof ConfigSchema>;
export declare function loadConfig(configPath?: string, cwd?: string, overrides?: Partial<ChangelogDebtConfig>): ChangelogDebtConfig;

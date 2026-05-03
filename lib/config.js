import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
export const TOOL_NAME = 'changelog-debt';
export const VERSION = '0.1.3';
export const DEFAULT_CONFIG_PATH = '.github/changelog-debt.yml';
export const ConfigSchema = z.object({
    mode: z.enum(['warn', 'fail']).default('warn'),
    visible_change_paths: z.array(z.string()).default(['openapi/**', 'schema.graphql', 'src/cli/**', 'src/api/public/**', 'src/billing/**', 'db/migrations/**', 'packages/sdk/**', 'app/routes/**']),
    release_note_paths: z.array(z.string()).default(['CHANGELOG.md', 'docs/releases/**', 'docs/changelog/**', '.changeset/**']),
    docs_paths: z.array(z.string()).default(['docs/**', 'README.md']),
    satisfy_with_labels: z.array(z.string()).default(['release-note-added', 'docs-updated']),
    waiver_labels: z.array(z.string()).default(['no-release-note-needed']),
    waiver_body_patterns: z.array(z.string()).default(['Release note waiver:']),
    max_findings: z.number().int().min(1).default(10)
});
export function loadConfig(configPath = DEFAULT_CONFIG_PATH, cwd = process.cwd(), overrides = {}) {
    const resolved = path.resolve(cwd, configPath);
    let section = {};
    if (fs.existsSync(resolved)) {
        const parsed = parse(fs.readFileSync(resolved, 'utf8')) ?? {};
        section = typeof parsed === 'object' && parsed !== null && 'changelog_debt' in parsed ? parsed.changelog_debt ?? {} : parsed;
    }
    return ConfigSchema.parse({ ...section, ...compact(overrides) });
}
function compact(value) {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
//# sourceMappingURL=config.js.map
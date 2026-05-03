import crypto from 'node:crypto';
import picomatch from 'picomatch';
import { changedFiles, readEvent } from './git.js';
import { TOOL_NAME, VERSION, loadConfig, type ChangelogDebtConfig } from './config.js';
import { createResult, type Finding, type Mode, type ScanResult } from './report.js';

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

export async function runScan(options: ScanOptions): Promise<ScanResult> {
  const cwd = options.cwd ?? process.cwd();
  const config = loadConfig(options.configPath, cwd, options.configOverrides);
  const mode = options.mode ?? config.mode;
  const files = changedFiles(options.base, options.head, cwd);
  const event = readEvent(options.eventPath);
  const labels = new Set((event?.labels ?? []).map((label) => label.toLowerCase()));
  const body = (event?.body ?? '').toLowerCase();

  const visible = files.filter((file) => matchesAny(file, config.visible_change_paths));
  const hasReleaseNote = files.some((file) => matchesAny(file, config.release_note_paths));
  const hasDocs = files.some((file) => matchesAny(file, config.docs_paths));
  const hasSatisfyingLabel = config.satisfy_with_labels.some((label) => labels.has(label.toLowerCase()));
  const hasWaiverLabel = config.waiver_labels.some((label) => labels.has(label.toLowerCase()));
  const hasWaiverPhrase = config.waiver_body_patterns.some((pattern) => body.includes(pattern.toLowerCase()));
  const satisfied = hasReleaseNote || hasDocs || hasSatisfyingLabel || hasWaiverLabel || hasWaiverPhrase;

  const findings: Finding[] = [];
  if (visible.length > 0 && !satisfied) {
    for (const file of visible.slice(0, config.max_findings)) {
      findings.push({
        id: 'changelog-debt:' + stableHash(file),
        severity: 'error',
        title: 'Customer-visible change without release note',
        message: file + ' is configured as customer-visible, but no changelog, docs update, release note label, or waiver was found.',
        evidence: { path: file, summary: 'matched visible_change_paths without a configured release-note satisfier' },
        recommendation: 'Add a changelog/docs update, add a configured release-note label, or apply a waiver with justification.'
      });
    }
  }

  return createResult({ tool: TOOL_NAME, version: VERSION, base: options.base, head: options.head, mode, findings });
}

function matchesAny(file: string, patterns: string[]): boolean {
  return patterns.length > 0 && picomatch(patterns, { dot: true })(file);
}

function stableHash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 12);
}

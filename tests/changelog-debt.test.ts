import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runScan } from '../src/index.js';

function repo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'changelog-debt-'));
  git(dir, ['init', '-b', 'main']);
  git(dir, ['config', 'user.name', 'Human']);
  git(dir, ['config', 'user.email', 'human@example.com']);
  write(dir, 'README.md', 'initial\n');
  commit(dir, 'initial');
  return dir;
}

function git(cwd: string, args: string[]): string { return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim(); }
function write(cwd: string, file: string, content: string): void { fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true }); fs.writeFileSync(path.join(cwd, file), content); }
function commit(cwd: string, msg: string): void { git(cwd, ['add', '.']); git(cwd, ['commit', '-m', msg]); }
function event(cwd: string, labels: string[] = [], body = ''): string { const file = path.join(cwd, 'event.json'); fs.writeFileSync(file, JSON.stringify({ pull_request: { title: 'change', body, labels: labels.map((name) => ({ name })), user: { login: 'human' } } })); return file; }

describe('changelog-debt', () => {
  it('reports visible paths without changelog evidence', async () => {
    const cwd = repo();
    const base = git(cwd, ['rev-parse', 'HEAD']);
    write(cwd, 'src/api/public/customers.ts', 'export const customers = true;\n');
    commit(cwd, 'public api');
    const result = await runScan({ base, head: 'HEAD', cwd, eventPath: event(cwd) });
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.message).toContain('src/api/public/customers.ts');
  });

  it('passes when CHANGELOG.md changed', async () => {
    const cwd = repo();
    const base = git(cwd, ['rev-parse', 'HEAD']);
    write(cwd, 'src/api/public/customers.ts', 'export const customers = true;\n');
    write(cwd, 'CHANGELOG.md', '- customers changed\n');
    commit(cwd, 'public api with note');
    const result = await runScan({ base, head: 'HEAD', cwd, eventPath: event(cwd) });
    expect(result.findings).toHaveLength(0);
  });

  it('passes with a waiver label', async () => {
    const cwd = repo();
    const base = git(cwd, ['rev-parse', 'HEAD']);
    write(cwd, 'src/billing/plans.ts', 'export const plans = [];\n');
    commit(cwd, 'billing');
    const result = await runScan({ base, head: 'HEAD', cwd, eventPath: event(cwd, ['no-release-note-needed']) });
    expect(result.findings).toHaveLength(0);
  });

  it('ignores non-visible paths', async () => {
    const cwd = repo();
    const base = git(cwd, ['rev-parse', 'HEAD']);
    write(cwd, 'internal/cache.ts', 'export const cache = true;\n');
    commit(cwd, 'internal');
    const result = await runScan({ base, head: 'HEAD', cwd, eventPath: event(cwd) });
    expect(result.findings).toHaveLength(0);
  });
});

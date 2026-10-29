import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { writeImportLog } from '../../../src/import/import-logger.js';

describe('writeImportLog', () => {
  let originalCwd: string;
  let tempDirectory: string;

  afterEach(async () => {
    if (originalCwd) {
      process.chdir(originalCwd);
    }

    if (tempDirectory) {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  });

  it('creates the log directory and writes the summary', async () => {
    originalCwd = process.cwd();
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'import-logger-'));
    process.chdir(tempDirectory);

    const summary = {
      sourceFile: '/input/clientes_antiguos.csv',
      startedAt: '2026-10-29T09:00:00.000Z',
      finishedAt: '2026-10-29T09:01:00.000Z',
      totalRows: 18,
      readyRows: 12,
      reviewRows: 3,
      rejectedRows: 1,
      duplicateRows: 2,
      warnings: 7,
      errors: 4,
    };

    const logPath = await writeImportLog('dry-run', summary);
    const content = await readFile(logPath, 'utf8');

    expect(logPath).toContain(path.join('logs', 'db'));
    expect(path.basename(logPath)).toMatch(/^dry-run-.*\.log$/);
    expect(content).toContain('Mode: dry-run');
    expect(content).toContain('Source file: clientes_antiguos.csv');
    expect(content).toContain('Total rows: 18');
    expect(content).toContain('Rows requiring review: 3');
    expect(content).toContain('Rejected rows: 1');
    expect(content).toContain('Duplicate rows: 2');
    expect(content).toContain('Warnings: 7');
    expect(content).toContain('Errors: 4');

    const fileStats = await stat(logPath);
    expect(fileStats.isFile()).toBe(true);
  });

  it('does not overwrite an existing log', async () => {
    originalCwd = process.cwd();
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'import-logger-'));
    process.chdir(tempDirectory);

    const summary = {
      sourceFile: 'clientes_antiguos.csv',
      startedAt: '2026-10-29T09:00:00.000Z',
      finishedAt: '2026-10-29T09:01:00.000Z',
      totalRows: 1,
      readyRows: 1,
      reviewRows: 0,
      rejectedRows: 0,
      duplicateRows: 0,
      warnings: 0,
      errors: 0,
    };

    const firstPath = await writeImportLog('dry-run', summary);
    const originalContent = await readFile(firstPath, 'utf8');

    await expect(writeImportLog('dry-run', summary)).rejects.toMatchObject({
      code: 'EEXIST',
    });

    expect(await readFile(firstPath, 'utf8')).toBe(originalContent);
  });

  it('creates an import-mode log', async () => {
    originalCwd = process.cwd();
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'import-logger-'));
    process.chdir(tempDirectory);

    const summary = {
      sourceFile: 'clientes_antiguos.csv',
      startedAt: '2026-10-29T09:00:00.000Z',
      finishedAt: '2026-10-29T09:01:00.000Z',
      totalRows: 18,
      readyRows: 12,
      reviewRows: 3,
      rejectedRows: 1,
      duplicateRows: 2,
      warnings: 7,
      errors: 4,
    };

    const logPath = await writeImportLog('import', summary);

    expect(path.basename(logPath)).toMatch(/^import-.*\.log$/);
    expect(await readFile(logPath, 'utf8')).toContain('Mode: import');
  });
});

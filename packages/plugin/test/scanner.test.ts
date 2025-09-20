import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createScanner } from '../src/scanner.ts';
import { MANIFEST_VERSION } from '../src/manifest.ts';

const basicFixtures = path.resolve(__dirname, 'fixtures/basic');
const ignoreFixtures = path.resolve(__dirname, 'fixtures/ignore');
const unsupportedFixtures = path.resolve(__dirname, 'fixtures/unsupported');
const defaultIgnoresFixtures = path.resolve(
  __dirname,
  'fixtures/default-ignores',
);

describe('createScanner', () => {
  it('emits versioned manifest with component props', () => {
    const scanner = createScanner({
      srcDir: basicFixtures,
      projectRoot: basicFixtures,
    });

    const manifest = scanner.scan();

    expect(manifest.version).toBe(MANIFEST_VERSION);
    expect(manifest.components).toHaveLength(2);

    const defaultComponent = manifest.components.find(component => component.isDefaultExport);
    const namedComponent = manifest.components.find(
      component => !component.isDefaultExport && component.name === 'Button',
    );

    if (!defaultComponent || !namedComponent) {
      throw new Error('Test fixture should include default and named Button components.');
    }

    expect(defaultComponent).toMatchObject({
      name: 'Button',
      path: 'Button.tsx',
      isDefaultExport: true,
    });
    expect(namedComponent).toMatchObject({
      name: 'Button',
      path: 'Button.tsx',
      isDefaultExport: false,
    });

    expect(namedComponent.props).toMatchObject({
      label: { type: 'string' },
      disabled: { type: 'boolean' },
      variant: { type: 'union', options: ['primary', 'secondary'] },
      tags: { type: 'array', element: { type: 'string' } },
      status: {
        type: 'enum',
        name: 'ButtonStatus',
        options: ['active', 'disabled'],
      },
    });
  });

  it('respects ignore patterns and logs skipped files', () => {
    const info = vi.fn();
    const scanner = createScanner({
      srcDir: ignoreFixtures,
      projectRoot: ignoreFixtures,
      ignore: ['**/Ignored.tsx'],
      logger: { info },
    });

    const manifest = scanner.scan();

    expect(manifest.components).toHaveLength(1);
    expect(manifest.components[0]).toMatchObject({ name: 'Button' });
    expect(info).toHaveBeenCalledWith('rplite:scanner:ignored', {
      path: 'Ignored.tsx',
      pattern: '**/Ignored.tsx',
    });
  });

  it('emits warnings for unsupported props and still includes supported ones', () => {
    const warn = vi.fn();
    const scanner = createScanner({
      srcDir: unsupportedFixtures,
      projectRoot: unsupportedFixtures,
      logger: { warn },
    });

    const manifest = scanner.scan();

    const bad = manifest.components.find(c => c.name === 'BadComponent');
    if (!bad) throw new Error('Expected BadComponent to be discovered');

    expect(bad.props).toEqual({ label: { type: 'string' } });
    expect(warn).toHaveBeenCalledWith(
      'rplite:scanner:unsupported-prop',
      expect.objectContaining({ component: 'BadComponent', prop: 'theme' }),
    );
    expect(warn).toHaveBeenCalledWith(
      'rplite:scanner:unsupported-prop',
      expect.objectContaining({ component: 'BadComponent', prop: 'options' }),
    );
  });

  it('skips tests, stories, and dist by default', () => {
    const scanner = createScanner({
      srcDir: defaultIgnoresFixtures,
      projectRoot: defaultIgnoresFixtures,
    });

    const manifest = scanner.scan();

    // Only components from Component.tsx should be included (2 exports).
    expect(manifest.components.length).toBe(2);
    for (const c of manifest.components) {
      expect(c.path).toBe('Component.tsx');
    }
  });
});

import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createScanner } from '../src/scanner.ts';
import { MANIFEST_VERSION } from '../src/manifest.ts';

const basicFixtures = path.resolve(__dirname, 'fixtures/basic');
const ignoreFixtures = path.resolve(__dirname, 'fixtures/ignore');

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
});

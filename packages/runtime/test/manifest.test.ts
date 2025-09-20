import { describe, expect, it } from 'vitest';
import { MANIFEST_VERSION } from '@rplite/plugin/manifest';
import {
  ManifestValidationError,
  validateManifest,
} from '../src/manifest';

const baseManifest = {
  version: MANIFEST_VERSION,
  components: [
    {
      name: 'Sample',
      path: 'Sample.tsx',
      isDefaultExport: false,
      props: {
        label: { type: 'string' },
        disabled: { type: 'boolean' },
        size: { type: 'union', options: ['sm', 'md', 'lg'] },
        status: {
          type: 'enum',
          name: 'Status',
          options: ['active', 'disabled'],
        },
        tags: {
          type: 'array',
          element: { type: 'string' },
        },
      },
    },
  ],
} as const;

describe('validateManifest', () => {
  it('accepts a manifest that matches the current schema', () => {
    const manifest = validateManifest(structuredClone(baseManifest));

    expect(manifest.version).toBe(MANIFEST_VERSION);
    expect(manifest.components).toHaveLength(1);
    expect(manifest.components[0].props.size).toEqual({
      type: 'union',
      options: ['sm', 'md', 'lg'],
    });
    expect(manifest.components[0].props.status).toEqual({
      type: 'enum',
      name: 'Status',
      options: ['active', 'disabled'],
    });
    expect(manifest.components[0].props.tags).toEqual({
      type: 'array',
      element: { type: 'string' },
    });
  });

  it('rejects manifests with mismatched version', () => {
    expect(() =>
      validateManifest({
        ...structuredClone(baseManifest),
        version: '2',
      }),
    ).toThrow(ManifestValidationError);
  });

  it('rejects manifests missing component arrays', () => {
    expect(() => validateManifest({ version: MANIFEST_VERSION })).toThrow(
      ManifestValidationError,
    );
  });

  it('rejects props without supported definitions', () => {
    expect(() =>
      validateManifest({
        version: MANIFEST_VERSION,
        components: [
          {
            name: 'BadComponent',
            path: 'Bad.tsx',
            isDefaultExport: false,
            props: {
              theme: { type: 'object' },
            },
          },
        ],
      }),
    ).toThrowError(/unsupported type/);
  });

  it('rejects array props without element definition', () => {
    expect(() =>
      validateManifest({
        version: MANIFEST_VERSION,
        components: [
          {
            name: 'BrokenArray',
            path: 'Broken.tsx',
            isDefaultExport: false,
            props: {
              items: { type: 'array' },
            },
          },
        ],
      }),
    ).toThrowError(/element definition/);
  });
});

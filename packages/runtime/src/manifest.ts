import { MANIFEST_VERSION } from '@rplite/plugin/manifest';
import type {
  ComponentDef,
  Manifest,
  PropDef,
} from '@rplite/plugin/manifest';

/**
 * Error thrown when the runtime receives an incompatible or malformed manifest.
 */
export class ManifestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManifestValidationError';
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new ManifestValidationError(message);
  }
}

function validatePropDef(
  componentName: string,
  propName: string,
  value: unknown,
): PropDef {
  assert(
    value !== null && typeof value === 'object',
    `Prop "${propName}" on component "${componentName}" must be an object.`,
  );

  const type = (value as { type?: unknown }).type;
  assert(
    type === 'string' || type === 'number' || type === 'boolean' || type === 'union',
    `Prop "${propName}" on component "${componentName}" has unsupported type "${String(
      type,
    )}".`,
  );

  if (type === 'union') {
    const options = (value as { options?: unknown }).options;
    assert(
      Array.isArray(options) && options.every(option => typeof option === 'string'),
      `Prop "${propName}" on component "${componentName}" must provide a string[] options array for union types.`,
    );
    return { type, options: [...options] };
  }

  return { type } as Extract<PropDef, { type: 'string' | 'number' | 'boolean' }>;
}

function validateComponentDef(index: number, value: unknown): ComponentDef {
  assert(value !== null && typeof value === 'object', `Component at index ${index} must be an object.`);
  const candidate = value as Partial<ComponentDef> & { props?: Record<string, unknown> | undefined };

  assert(typeof candidate.name === 'string' && candidate.name.length > 0, `Component at index ${index} requires a name.`);
  assert(
    typeof candidate.path === 'string' && candidate.path.length > 0,
    `Component "${candidate.name ?? `#${index}`}" requires a file path.`,
  );
  assert(
    typeof candidate.isDefaultExport === 'boolean',
    `Component "${candidate.name}" must specify whether it is a default export.`,
  );

  const propsRecord = candidate.props ?? {};
  assert(
    typeof propsRecord === 'object' && propsRecord !== null && !Array.isArray(propsRecord),
    `Component "${candidate.name}" must define props as an object map.`,
  );

  const validatedProps: Record<string, PropDef> = {};
  for (const [propName, propValue] of Object.entries(propsRecord)) {
    validatedProps[propName] = validatePropDef(candidate.name, propName, propValue);
  }

  return {
    name: candidate.name,
    path: candidate.path,
    isDefaultExport: candidate.isDefaultExport,
    props: validatedProps,
  };
}

/**
 * Validates the manifest produced by the Vite plugin before rendering the playground.
 * Throws a {@link ManifestValidationError} if the payload is incompatible.
 */
export function validateManifest(payload: unknown): Manifest {
  assert(payload !== null && typeof payload === 'object', 'Manifest payload must be an object.');
  const candidate = payload as Partial<Manifest> & {
    version?: unknown;
    components?: unknown;
  };

  assert(
    candidate.version === MANIFEST_VERSION,
    `Unsupported manifest version "${String(candidate.version)}". Expected version "${MANIFEST_VERSION}".`,
  );

  assert(Array.isArray(candidate.components), 'Manifest "components" must be an array.');

  const components = candidate.components.map((component, index) =>
    validateComponentDef(index, component),
  );

  return {
    version: MANIFEST_VERSION,
    components,
  };
}


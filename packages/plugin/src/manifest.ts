/**
 * Version identifier for the component manifest contract shared between
 * the plugin and runtime. Increment this when making breaking schema changes.
 */
export type ManifestVersion = '1';

/**
 * The current manifest schema version emitted by the plugin.
 */
export const MANIFEST_VERSION: ManifestVersion = '1';

/**
 * Defines the types of props that can be inferred and controlled in the playground.
 */
export type PropDef =
  | { type: 'string' }
  | { type: 'number' }
  | { type: 'boolean' }
  | { type: 'union'; options: string[] };

/**
 * Represents a discovered React component.
 */
export interface ComponentDef {
  /** The name of the component. */
  name: string;
  /** The component's file path, relative to the project root. */
  path: string;
  /** A map of prop names to their inferred definitions. */
  props: Record<string, PropDef>;
  /** Whether the component is a default export. */
  isDefaultExport: boolean;
}

/**
 * The manifest of all discovered components.
 */
export interface Manifest {
  /** Schema version used by the runtime to assert compatibility. */
  version: ManifestVersion;
  /** All components discovered by the scanner. */
  components: ComponentDef[];
}


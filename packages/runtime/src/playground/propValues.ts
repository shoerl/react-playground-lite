import type {
  DiscriminatedUnionPropDef,
  OptionPropDef,
  PrimitivePropDef,
  PropDef,
} from '@rplite/plugin/manifest';

const SAMPLE_TAGS = ['Design', 'Analytics', 'Collaboration'];

function getArrayInitialValues(
  element: PrimitivePropDef | OptionPropDef,
): unknown[] {
  switch (element.type) {
    case 'string':
      return [...SAMPLE_TAGS];
    case 'number':
      return [25, 75];
    case 'boolean':
      return [true];
    case 'union':
    case 'enum':
      return element.options.length > 0 ? [element.options[0]] : [];
    default:
      return [];
  }
}

function getOptionByValue(
  def: DiscriminatedUnionPropDef,
  value: string | undefined,
) {
  if (!value) return def.options[0];
  return def.options.find(option => option.value === value) ?? def.options[0];
}

function createDiscriminatedUnionValue(
  def: DiscriminatedUnionPropDef,
  optionValue?: string,
): Record<string, unknown> {
  const option = getOptionByValue(def, optionValue);
  const discriminantValue = option?.value ?? def.options[0]?.value ?? '';
  const result: Record<string, unknown> = {
    [def.discriminant]: discriminantValue,
  };

  if (option) {
    for (const [propName, propDef] of Object.entries(option.props)) {
      const initial = getInitialPropValue(propDef);
      if (initial !== undefined) {
        result[propName] = initial;
      }
    }
  }

  return result;
}

export function ensureDiscriminatedUnionValue(
  def: DiscriminatedUnionPropDef,
  value: unknown,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createDiscriminatedUnionValue(def);
  }

  const record = value as Record<string, unknown>;
  const currentOption = getOptionByValue(
    def,
    typeof record[def.discriminant] === 'string'
      ? (record[def.discriminant] as string)
      : undefined,
  );

  if (!currentOption) {
    return createDiscriminatedUnionValue(def);
  }

  const normalized: Record<string, unknown> = {
    [def.discriminant]: currentOption.value,
  };

  for (const [propName, propDef] of Object.entries(currentOption.props)) {
    const existing = record[propName];
    if (existing !== undefined) {
      normalized[propName] = existing;
    } else {
      const initial = getInitialPropValue(propDef);
      if (initial !== undefined) {
        normalized[propName] = initial;
      }
    }
  }

  return normalized;
}

export function buildDiscriminatedUnionVariant(
  def: DiscriminatedUnionPropDef,
  variant: string,
): Record<string, unknown> {
  return createDiscriminatedUnionValue(def, variant);
}

export function getInitialPropValue(propDef: PropDef): unknown {
  switch (propDef.type) {
    case 'string':
      return 'Sample text';
    case 'number':
      return 1;
    case 'boolean':
      return true;
    case 'union':
    case 'enum':
      return propDef.options[0] ?? '';
    case 'array':
      return getArrayInitialValues(propDef.element);
    case 'discriminated-union':
      return createDiscriminatedUnionValue(propDef);
    default:
      return undefined;
  }
}

export function describeArrayElement(
  element: PrimitivePropDef | OptionPropDef,
): string {
  switch (element.type) {
    case 'string':
      return 'Comma-separated text values';
    case 'number':
      return 'Comma-separated numbers';
    case 'boolean':
      return 'Comma-separated true/false values';
    case 'union':
    case 'enum':
      return `Allowed values: ${element.options.join(', ')}`;
    default:
      return 'Comma-separated values';
  }
}

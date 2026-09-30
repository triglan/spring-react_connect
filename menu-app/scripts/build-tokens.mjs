import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokenPath = path.join(projectRoot, 'design', 'montage.tokens.json');
const outputPath = path.join(projectRoot, 'src', 'tokens.css');
const tokens = JSON.parse(await readFile(tokenPath, 'utf8'));

const toKebabCase = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[._\s]+/g, '-')
    .toLowerCase();

const collectTokens = (group, prefix = '', result = []) => {
  for (const [name, value] of Object.entries(group)) {
    const tokenName = prefix ? `${prefix}.${name}` : name;
    if (value?.$type) result.push([tokenName, value]);
    else if (value && typeof value === 'object') collectTokens(value, tokenName, result);
  }
  return result;
};

const requiredGroups = [
  'color',
  'shadow',
  'effect',
  'typography',
  'spacing',
  'radius',
  'opacity',
  'breakpoint',
  'zIndex',
];

for (const group of requiredGroups) {
  if (!tokens[group]) throw new Error(`Missing token group: ${group}`);
}

const declarations = new Set();
const rootVariables = [];
const darkVariables = [];

const addVariable = (target, name, value) => {
  if (target === rootVariables) {
    if (declarations.has(name)) throw new Error(`Duplicate CSS variable: ${name}`);
    declarations.add(name);
  }
  target.push(`  ${name}: ${value};`);
};

for (const [name, token] of collectTokens(tokens.color)) {
  const variable = `--color-${toKebabCase(name)}`;
  addVariable(rootVariables, variable, token.light.value);
  addVariable(darkVariables, variable, token.dark.value);
}

// fontFamily, motion 은 선택 그룹이다. 있으면 같은 방식으로 변수를 만든다.
for (const group of ['spacing', 'radius', 'opacity', 'breakpoint', 'zIndex', 'fontFamily', 'motion']) {
  if (!tokens[group]) continue;
  for (const [name, token] of collectTokens(tokens[group])) {
    addVariable(rootVariables, `--${toKebabCase(group)}-${toKebabCase(name)}`, token.value);
  }
}

const typographyClasses = [];
for (const [name, token] of collectTokens(tokens.typography)) {
  const className = toKebabCase(name.replace(/^variant\./, ''));
  const variablePrefix = `--typography-${className}`;

  addVariable(rootVariables, `${variablePrefix}-font-size`, token.fontSize.rem);
  addVariable(rootVariables, `${variablePrefix}-line-height`, token.lineHeight.rem);
  addVariable(rootVariables, `${variablePrefix}-letter-spacing`, token.letterSpacing.em);

  for (const [weightName, weight] of Object.entries(token.fontWeight)) {
    addVariable(rootVariables, `${variablePrefix}-font-weight-${weightName}`, weight);
  }

  typographyClasses.push(
    `.${className} {`,
    `  font-size: var(${variablePrefix}-font-size);`,
    `  line-height: var(${variablePrefix}-line-height);`,
    `  letter-spacing: var(${variablePrefix}-letter-spacing);`,
    '}',
    ...Object.keys(token.fontWeight).flatMap((weightName) => [
      `.${className}.${weightName} {`,
      `  font-weight: var(${variablePrefix}-font-weight-${weightName});`,
      '}',
    ]),
  );
}

const flattenValue = (value, prefix = '', result = []) => {
  if (!value || typeof value !== 'object') {
    result.push([prefix, value]);
    return result;
  }
  for (const [name, nestedValue] of Object.entries(value)) {
    flattenValue(nestedValue, prefix ? `${prefix}-${toKebabCase(name)}` : toKebabCase(name), result);
  }
  return result;
};

for (const group of ['shadow', 'effect']) {
  for (const [name, token] of collectTokens(tokens[group])) {
    const variablePrefix = `--${toKebabCase(group)}-${toKebabCase(name)}`;
    const lightValue = token.light.value ?? token.light;
    const darkValue = token.dark.value ?? token.dark;

    for (const [suffix, value] of flattenValue(lightValue)) {
      addVariable(rootVariables, `${variablePrefix}${suffix ? `-${suffix}` : ''}`, value);
    }
    for (const [suffix, value] of flattenValue(darkValue)) {
      addVariable(darkVariables, `${variablePrefix}${suffix ? `-${suffix}` : ''}`, value);
    }
  }
}

const css = [
  ':root {',
  ...rootVariables,
  '}',
  '',
  '[data-theme="dark"] {',
  ...darkVariables,
  '}',
  '',
  ...typographyClasses,
  '',
].join('\n');

await writeFile(outputPath, css, 'utf8');

console.log(`Generated ${path.relative(projectRoot, outputPath)}`);

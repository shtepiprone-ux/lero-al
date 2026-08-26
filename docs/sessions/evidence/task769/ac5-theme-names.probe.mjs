import { extractMantineThemeNames } from 'file:///C:/Claude_Code_Projects/lero-al/scripts/check-tailwind-runtime-tokens.mjs';

const result = extractMantineThemeNames();
if (result.fatal) {
  console.log('FATAL:', result.fatal);
  process.exit(1);
}
const sorted = [...result.names].sort();
console.log(sorted.length, JSON.stringify(sorted));
console.log('has --button-padding-x:', result.names.has('--button-padding-x'));
console.log('has --mantine-color-default-border:', result.names.has('--mantine-color-default-border'));

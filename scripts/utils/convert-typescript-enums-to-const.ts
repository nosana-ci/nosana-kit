
import fs from 'fs';
import path from 'path';

/**
 * Converts TypeScript enums to `as const` objects
 * @param content - The file content to transform
 * @returns The transformed content
 */
function convertEnumsToAsConst(content: string): string {
  // Match: export enum EnumName { ... }
  const enumPattern = /export enum (\w+)\s*\{([^}]+)\}/g;

  return content.replace(enumPattern, (match, enumName, enumBody) => {
    // Parse enum members
    const members = enumBody
      .split(',')
      .map((member: string) => member.trim())
      .filter((member: string) => member.length > 0)
      .map((member: string) => {
        // Handle both: "MemberName" and "MemberName = value"
        const parts = member.split('=').map((p: string) => p.trim());
        const memberName = parts[0];
        return memberName;
      });

    // Build the as const object
    const constObject = members
      .map((name: string) => `  ${name}: "${name}"`)
      .join(',\n');

    return `export const ${enumName} = {\n${constObject},\n} as const;\nexport type ${enumName} = (typeof ${enumName})[keyof typeof ${enumName}];`;
  });
}

/**
 * Process all TypeScript files in a directory to convert enums to as const
 * @param directory - The directory to process
 */
export function processEnumsInDirectory(directory: string): void {
  if (!fs.existsSync(directory)) {
    console.log(`Directory ${directory} does not exist, skipping enum processing.`);
    return;
  }

  function walkDirectory(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walkDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const transformed = convertEnumsToAsConst(content);

        if (content !== transformed) {
          fs.writeFileSync(fullPath, transformed, 'utf-8');
          console.log(`Converted enums in: ${path.relative(directory, fullPath)}`);
        }
      }
    }
  }

  walkDirectory(directory);
}

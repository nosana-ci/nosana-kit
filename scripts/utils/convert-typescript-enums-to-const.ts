/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

/**
 * Converts TypeScript enums to `as const` objects and adds .js extensions to imports
 * @param content - The file content to transform
 * @param filePath - The path to the file being transformed
 * @returns The transformed content
 */
function convertEnumsToAsConst(content: string, filePath: string): string {
  // First, collect all enum names that we're converting
  const enumPattern = /export enum (\w+)\s*\{([^}]+)\}/g;
  const convertedEnums: Set<string> = new Set();

  let match;
  while ((match = enumPattern.exec(content)) !== null) {
    convertedEnums.add(match[1]);
  }

  // Replace enum declarations with as const objects
  let result = content.replace(/export enum (\w+)\s*\{([^}]+)\}/g, (match, enumName, enumBody) => {
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
    const constObject = members.map((name: string) => `  ${name}: "${name}"`).join(',\n');

    return `export const ${enumName} = {\n${constObject},\n} as const;\nexport type ${enumName} = (typeof ${enumName})[keyof typeof ${enumName}];`;
  });

  // Add typeof only for enums we converted, in type annotation positions (after : in types)
  convertedEnums.forEach((enumName) => {
    const typePattern = new RegExp(`(:\\s*)${enumName}\\.(\\w+);`, 'g');
    result = result.replace(typePattern, `$1typeof ${enumName}.$2;`);
  });

  // Add .js extensions to relative imports/exports
  // Matches: from './path' or from "../path" (but not from 'package-name')
  result = result.replace(
    /(from\s+['"])(\.\.[/\w-]*|\.\/[\w/-]*?)(['"])/g,
    (match, prefix, importPath, suffix) => {
      // Don't add .js if already has an extension
      if (importPath.match(/\.\w+$/)) {
        return match;
      }

      // Check if the import path points to a directory by looking at the file system
      const resolvedPath = path.resolve(path.dirname(filePath), importPath);

      // If it's a directory or the path doesn't explicitly point to a file, add /index.js
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
        return `${prefix}${importPath}/index.js${suffix}`;
      }

      // Otherwise just add .js
      return `${prefix}${importPath}.js${suffix}`;
    }
  );

  return result;
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
        const transformed = convertEnumsToAsConst(content, fullPath);

        if (content !== transformed) {
          fs.writeFileSync(fullPath, transformed, 'utf-8');
          console.log(`Processed: ${path.relative(directory, fullPath)}`);
        }
      }
    }
  }

  walkDirectory(directory);
}

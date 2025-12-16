/* eslint-disable no-console */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { Visitor } from '@codama/visitors-core';
import type { ProgramNode, InstructionNode } from '@codama/node-types';
import { mergeVisitor, extendVisitor } from '@codama/visitors-core';

interface InstructionAccountInfo {
  name: string;
  accounts: Array<{ name: string; index: number }>;
}

interface InstructionAccountIndices {
  [instructionName: string]: InstructionAccountInfo;
}

/**
 * Visitor that collects account index information from the Codama model.
 * Returns the collected data for post-processing (file injection).
 * 
 * Uses the mergeVisitor pattern to collect data from program nodes.
 */
export function createAccountIndicesVisitor(): Visitor<InstructionAccountIndices> {
  // Use mergeVisitor to collect data: return empty object for leaves, merge for nodes
  const baseVisitor = mergeVisitor<InstructionAccountIndices>(
    () => ({}), // Leaf nodes return empty object
    (_, values) => {
      // Merge all child results into one object
      return Object.assign({}, ...values);
    }
  );

  return extendVisitor(baseVisitor, {
    visitProgram(node: ProgramNode, { next }): InstructionAccountIndices {
      const instructionIndices: InstructionAccountIndices = {};

      if (node.instructions) {
        // Collect account indices for each instruction
        for (const instruction of node.instructions) {
          if (instruction.kind === 'instructionNode') {
            const instNode = instruction as InstructionNode;
            const instructionName = instNode.name;

            if (!instNode.accounts || instNode.accounts.length === 0) {
              continue;
            }

            // Collect accounts in order with their indices
            const accounts: Array<{ name: string; index: number }> = [];
            instNode.accounts.forEach((account, index) => {
              // Account is an instructionAccountNode with a name property
              if (
                typeof account === 'object' &&
                account !== null &&
                'name' in account &&
                typeof account.name === 'string'
              ) {
                accounts.push({ name: account.name, index });
              }
            });

            if (accounts.length > 0) {
              instructionIndices[instructionName] = {
                name: instructionName,
                accounts,
              };
            }
          }
        }
      }

      // Get merged results from children and merge with our collected data
      const childResults = next(node);
      return { ...childResults, ...instructionIndices };
    },
  });
}

/**
 * Injects account index constants into instruction files after collection.
 * This should be called after the visitor has collected data from the model.
 */
export function injectAccountIndicesIntoFiles(
  outputPath: string,
  indices: InstructionAccountIndices
): void {

  const instructionsDir = path.join(outputPath, 'instructions');

  for (const [instructionName, accountInfo] of Object.entries(indices)) {
    const fileName = `${instructionName}.ts`;
    const filePath = path.join(instructionsDir, fileName);

    // Skip if file doesn't exist (shouldn't happen, but be safe)
    if (!existsSync(filePath)) {
      console.warn(`Instruction file not found: ${filePath}`);
      continue;
    }

    const content = readFileSync(filePath, 'utf-8');
    const constantName = `${toScreamingSnake(instructionName)}_INSTRUCTION_ACCOUNTS`;

    // Check if constants already exist (idempotency)
    if (content.includes(`export const ${constantName} = {`)) {
      continue; // Already has constants, skip
    }

    const constantsCode = generateAccountConstants(instructionName, accountInfo.accounts);
    const insertPosition = findInsertionPoint(content);

    const newContent =
      content.slice(0, insertPosition) + constantsCode + content.slice(insertPosition);

    writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Added account indices to: ${path.relative(process.cwd(), filePath)}`);
  }
}

/**
 * Generates the account index constants code for a single instruction
 */
function generateAccountConstants(
  instructionName: string,
  accounts: Array<{ name: string; index: number }>
): string {
  const constantName = `${toScreamingSnake(instructionName)}_INSTRUCTION_ACCOUNTS`;
  const typeName = `${capitalizeFirst(instructionName)}InstructionAccountName`;

  const lines: string[] = [];
  lines.push(`export const ${constantName} = {`);
  // Emit accounts in their original order (by index) from the IDL
  for (const { name, index } of accounts) {
    lines.push(`  ${quoteKeyIfNeeded(name)}: ${index},`);
  }
  lines.push(`} as const;`);
  lines.push('');
  lines.push(`export type ${typeName} = keyof typeof ${constantName};`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Finds the insertion point after the last import statement
 */
function findInsertionPoint(content: string): number {
  // Find the last import statement (handles both import ... from and import ...;)
  const importPattern = /(?:^import\s+.*?from\s+['"].*?['"];|^import\s+.*?;)/gm;
  const imports = Array.from(content.matchAll(importPattern));

  if (imports.length === 0) {
    // No imports found, insert after file header comment if present
    const headerEnd = content.match(/^\/\*\*[\s\S]*?\*\/\s*\n/);
    return headerEnd ? headerEnd.index! + headerEnd[0].length : 0;
  }

  // Get the last import and insert after it (plus blank line)
  const lastImport = imports[imports.length - 1];
  const insertPos = lastImport.index! + lastImport[0].length;

  // Skip any trailing blank lines after imports (match multiple newlines)
  const afterImport = content.slice(insertPos);
  const blankLinesMatch = afterImport.match(/^\s*\n*/);
  const skipLines = blankLinesMatch ? blankLinesMatch[0].length : 0;

  return insertPos + skipLines;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to SCREAMING_SNAKE_CASE
 * Handles camelCase, kebab-case, and spaces
 */
function toScreamingSnake(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toUpperCase();
}

/**
 * Quotes a key if it's not a valid JavaScript identifier
 */
function quoteKeyIfNeeded(key: string): string {
  // Check if the key is a valid JavaScript identifier
  // Valid identifiers start with letter/underscore/$ and contain only letters/digits/underscore/$
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return key;
  }
  // Quote if it contains special characters, starts with a number, or is a reserved word
  return JSON.stringify(key);
}

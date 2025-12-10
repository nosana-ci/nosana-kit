// @ts-check
import prettier from '@prettier/sync';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import * as td from 'typedoc-plugin-markdown';

const METHOD_SIGNATURE_COLUMN_WIDTH = 72;

/** @type {import("prettier").Options | null} */
const prettierConfig = prettier.resolveConfig(import.meta.dirname);

// Load index page templates (stored outside docs/api/ to avoid being overwritten)
const TEMPLATES_DIR = join(import.meta.dirname, 'docs', '.api-templates');
const INDEX_INTRO = readFileSync(join(TEMPLATES_DIR, 'intro.md'), 'utf8');
const INDEX_FOOTER = readFileSync(join(TEMPLATES_DIR, 'footer.md'), 'utf8');

// Kind detection patterns and their display names
const KIND_PATTERNS = [
    { pattern: /\/namespaces\//, kind: 'Namespaces', singular: 'Namespace' },
    { pattern: /\/enumerations\//, kind: 'Enumerations', singular: 'Enumeration' },
    { pattern: /\/classes\//, kind: 'Classes', singular: 'Class' },
    { pattern: /\/interfaces\//, kind: 'Interfaces', singular: 'Interface' },
    { pattern: /\/type-aliases\//, kind: 'Type Aliases', singular: 'Type Alias' },
    { pattern: /\/functions\//, kind: 'Functions', singular: 'Function' },
    { pattern: /\/variables\//, kind: 'Variables', singular: 'Variable' },
];

/**
 * Split a group's single table into multiple tables organized by kind
 * @param {string} tableContent - The table rows (without header)
 * @returns {string} - Reformatted content with kind subheadings
 */
function splitTableByKind(tableContent) {
    const rows = tableContent.split('\n').filter(row => row.startsWith('|') && !row.includes('------'));
    
    // Group rows by kind
    /** @type {Map<string, {singular: string, rows: string[]}>} */
    const kindGroups = new Map();
    
    for (const row of rows) {
        // Extract the link from the row to determine kind
        const linkMatch = row.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (!linkMatch) continue;
        
        const url = linkMatch[2];
        let foundKind = null;
        
        for (const { pattern, kind, singular } of KIND_PATTERNS) {
            if (pattern.test(url)) {
                foundKind = { kind, singular };
                break;
            }
        }
        
        if (!foundKind) continue;
        
        if (!kindGroups.has(foundKind.kind)) {
            kindGroups.set(foundKind.kind, { singular: foundKind.singular, rows: [] });
        }
        kindGroups.get(foundKind.kind).rows.push(row);
    }
    
    // Build output with subheadings for each kind
    let output = '';
    for (const { pattern, kind, singular } of KIND_PATTERNS) {
        const group = kindGroups.get(kind);
        if (!group || group.rows.length === 0) continue;
        
        output += `\n### ${kind}\n\n`;
        output += `| ${singular} | Description |\n`;
        output += `| ------ | ------ |\n`;
        output += group.rows.join('\n') + '\n';
    }
    
    return output;
}

/**
 * Process the index page to add kind subheadings within each group
 * @param {string} content - The full index.md content
 * @returns {string} - Processed content with kind subheadings
 */
function addKindSubheadings(content) {
    // Match each group section: ## GroupName followed by a table
    const groupPattern = /^(## @[^\n]+)\n\n(\| Name \| Description \|\n\| ------ \| ------ \|\n)((?:\| .+\n)+)/gm;
    
    return content.replace(groupPattern, (match, heading, tableHeader, tableRows) => {
        const kindContent = splitTableByKind(tableRows);
        return `${heading}\n${kindContent}`;
    });
}

class NosanaDocsMarkdownTheme extends td.MarkdownTheme {
    /** @param {td.MarkdownPageEvent<import('typedoc').Reflection>} page */
    getRenderContext(page) {
        return new NosanaDocsThemeRenderContext(this, page, this.application.options);
    }
}

class NosanaDocsThemeRenderContext extends td.MarkdownThemeContext {
    /** @param {ConstructorParameters<typeof td.MarkdownThemeContext>} args */
    constructor(...args) {
        super(...args);
        const oldSignatureTitle = this.partials.signatureTitle;
        this.partials = {
            ...this.partials,
            signatureTitle(model, options) {
                const titleMarkdown = oldSignatureTitle(model, options);
                return prettier.format(titleMarkdown, {
                    ...prettierConfig,
                    printWidth: METHOD_SIGNATURE_COLUMN_WIDTH,
                    parser: 'markdown',
                });
            },
        };
    }
}

/** @param {td.MarkdownApplication} app */
export function load(app) {
    // Use this theme name in typedoc.json or when using the CLI
    app.renderer.defineTheme('nosana-docs-theme', NosanaDocsMarkdownTheme);

    // Set Markdown frontmatter for each page
    app.renderer.on(td.MarkdownPageEvent.BEGIN, page => {
        page.frontmatter = {
            title: page.url === 'index.md' ? 'API Reference' : page.model.name,
            // Disable prev/next navigation for API pages (they're reference docs, not sequential)
            prev: false,
            next: false,
        };
    });

    // Rewrite all of the internal links and add intro/footer to index
    app.renderer.on(td.MarkdownPageEvent.END, page => {
        if (!page.contents) return;

        // Rewrite links to be root relative for VitePress
        page.contents = page.contents.replace(/]\(((?:[^\/\)]+\/)*[^\/\)]+)\.md([^)]*)?\)/gm, (_, path, suffix) => {
            const rootRelativeUrl = resolve('/api', dirname(page.url), path);
            return `](${rootRelativeUrl}${suffix ?? ''})`;
        });

        // Escape standalone Array<T> patterns that VitePress would parse as HTML
        // Match Array<...> outside of code blocks and backticks
        page.contents = page.contents.replace(/^(Array<[^>]+>)$/gm, '`$1`');

        // Process index page: add intro, kind subheadings, and footer
        if (page.url === 'index.md') {
            const frontmatterEnd = page.contents.indexOf('---', 4) + 3;
            const frontmatter = page.contents.slice(0, frontmatterEnd);
            let content = page.contents.slice(frontmatterEnd);
            
            // Add kind subheadings within each group
            content = addKindSubheadings(content);
            
            page.contents = frontmatter + '\n' + INDEX_INTRO + content + '\n' + INDEX_FOOTER;
        }
    });
}


import type { PluginSimple } from 'markdown-it';
import container from 'markdown-it-container';

const chartPlugin: PluginSimple = (md) => {
  // Store original fence renderer
  const defaultFenceRender =
    md.renderer.rules.fence ||
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

  // Override fence renderer to handle JSON inside chart containers
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];

    // Check if we're inside a chart container
    if (env.chartContainer && token.info.trim() === 'json') {
      const jsonContent = token.content.trim();
      try {
        // Parse to validate JSON
        const parsed = JSON.parse(jsonContent);
        // Convert to JSON string
        const jsonString = JSON.stringify(parsed);
        // HTML escape the JSON string for use in attribute
        const htmlEscaped = jsonString
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        const title = env.chartContainer.title || '';
        // Clear the chart container flag BEFORE returning
        delete env.chartContainer;
        // Use data attribute with HTML-escaped JSON, then decode in component
        return `<Chart data-config="${htmlEscaped}"${title ? ` title="${title}"` : ''} />\n`;
      } catch (e) {
        console.error('Invalid JSON in chart:', e);
        // Make sure to clear the flag even on error
        delete env.chartContainer;
        return defaultFenceRender(tokens, idx, options, env, self);
      }
    }

    return defaultFenceRender(tokens, idx, options, env, self);
  };

  // Add container rule for ::: chart
  md.use(container, 'chart', {
    validate: (params: string) => {
      return params.trim().match(/^chart\s*(.*)$/);
    },
    render: (tokens: any[], idx: number, options: any, env: any) => {
      const token = tokens[idx];
      const match = token.info.trim().match(/^chart\s*(.*)$/);
      const title = match ? match[1] : '';

      if (token.nesting === 1) {
        // Opening tag - set flag in environment
        if (!env.chartContainer) {
          env.chartContainer = { title };
        }
        return '';
      } else {
        // Closing tag
        return '';
      }
    },
  });
};

export default chartPlugin;

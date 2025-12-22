import type { Theme, EnhanceAppContext } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client';
import '@shikijs/vitepress-twoslash/style.css';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import GlossaryTooltip from 'vitepress-plugin-glossary/vue';
import './custom.css';

// Import custom components
import Card from '../components/Card.vue';
import Chart from '../components/Chart.vue';
import GlossaryList from '../components/GlossaryList.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }: EnhanceAppContext) {
    // Register Twoslash FloatingVue plugin for type hover tooltips
    app.use(TwoslashFloatingVue);
    // Register tabs plugin
    enhanceAppWithTabs(app);
    // Register glossary tooltip component
    app.component('GlossaryTooltip', GlossaryTooltip);
    // Register global components
    app.component('Card', Card);
    app.component('Chart', Chart);
    app.component('GlossaryList', GlossaryList);
  },
} satisfies Theme;

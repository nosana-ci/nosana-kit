import type { Theme, EnhanceAppContext } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client';
import '@shikijs/vitepress-twoslash/style.css';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import './custom.css';

// Import custom components
import Card from '../components/Card.vue';
import Chart from '../components/Chart.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }: EnhanceAppContext) {
    // Register Twoslash FloatingVue plugin for type hover tooltips
    app.use(TwoslashFloatingVue);
    // Register tabs plugin
    enhanceAppWithTabs(app);
    // Register global components
    app.component('Card', Card);
    app.component('Chart', Chart);
  },
} satisfies Theme;

import type { Theme, EnhanceAppContext } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import '@shikijs/twoslash/style-rich.css';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import GlossaryTooltip from 'vitepress-plugin-glossary/vue';
import './custom.css';
import Layout from './Layout.vue';

// Import custom components
import Card from '../components/Card.vue';
import Chart from '../components/Chart.vue';
import GlossaryList from '../components/GlossaryList.vue';
import GPUMarkets from '../components/GPUMarkets.vue';
import FontIcon from '../components/FontIcon.vue';

export default {
  extends: DefaultTheme,
  Layout: Layout,
  enhanceApp({ app, router }: EnhanceAppContext) {
    // Register tabs plugin
    enhanceAppWithTabs(app);
    // Register glossary tooltip component
    app.component('GlossaryTooltip', GlossaryTooltip);
    // Register global components
    app.component('Card', Card);
    app.component('Chart', Chart);
    app.component('GlossaryList', GlossaryList);
    app.component('GPUMarkets', GPUMarkets);
    app.component('FontIcon', FontIcon);
  },
} satisfies Theme;

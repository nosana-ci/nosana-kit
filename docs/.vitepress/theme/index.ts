import type { Theme, EnhanceAppContext } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client';
import '@shikijs/vitepress-twoslash/style.css';
import './custom.css';

// Import custom components
import Callout from '../components/Callout.vue';
import Card from '../components/Card.vue';
import Tabs from '../components/Tabs.vue';
import Steps from '../components/Steps.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }: EnhanceAppContext) {
    // Register Twoslash FloatingVue plugin for type hover tooltips
    app.use(TwoslashFloatingVue, {
      // themes: {
      //   'twoslash-query': {
      //     triggers: ['hover'],
      //     popperTriggers: ['hover'],
      //     autoHide: true,
      //   },
      // },
    });
    // Register global components
    app.component('Callout', Callout);
    app.component('Card', Card);
    app.component('Tabs', Tabs);
    app.component('Steps', Steps);
  },
} satisfies Theme;

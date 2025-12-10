import { h } from 'vue';
import type { Theme, EnhanceAppContext } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client';
import '@shikijs/vitepress-twoslash/style.css';
import './custom.css';
import { hideTwoslashPopups } from './hide-popups';

// Import custom components
import Callout from '../components/Callout.vue';
import Card from '../components/Card.vue';
import Tabs from '../components/Tabs.vue';
import Steps from '../components/Steps.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }: EnhanceAppContext) {
    // Register Twoslash FloatingVue plugin for type hover tooltips
    // Configure query markers (^?) to use hover instead of click-to-toggle
    app.use(TwoslashFloatingVue, {
      themes: {
        'twoslash-query': {
          triggers: ['hover'],
          popperTriggers: ['hover'],
          autoHide: true,
        },
      },
    });

    // Hide any popups that are shown on page load
    if (typeof window !== 'undefined') {
      // Run on initial load
      hideTwoslashPopups();

      // Run after route changes
      router.onAfterRouteChanged = () => {
        setTimeout(hideTwoslashPopups, 100);
      };
    }

    // Register global components
    app.component('Callout', Callout);
    app.component('Card', Card);
    app.component('Tabs', Tabs);
    app.component('Steps', Steps);
  },
} satisfies Theme;

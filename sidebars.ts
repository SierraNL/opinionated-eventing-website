import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'getting-started',
    'commands-vs-events',
    'outbox-pattern',
    {
      type: 'category',
      label: 'Sagas',
      items: ['sagas-orchestration', 'sagas-choreography'],
    },
    'ddd-aggregates',
    'local-development',
    'observability',
    'idempotency',
  ],
};

export default sidebars;

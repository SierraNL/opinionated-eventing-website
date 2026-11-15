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
    {
      type: 'category',
      label: 'For AI agents',
      items: [
        'ai/agent-guide',
        'ai/api-cheat-sheet',
        'ai/packages',
        'ai/recipes',
        'ai/migration-mapping',
        'ai/templates',
      ],
    },
  ],
};

export default sidebars;

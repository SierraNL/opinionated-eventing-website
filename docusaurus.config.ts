import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'OpinionatedEventing',
  tagline: 'Opinionated event-driven messaging for .NET — correctness and safe defaults over maximum flexibility.',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://opinionated-eventing.com',
  baseUrl: '/',

  organizationName: 'SierraNL',
  projectName: 'OpinionatedEventing',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/SierraNL/OpinionatedEventing/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'OpinionatedEventing',
      logo: {
        alt: 'OpinionatedEventing Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://www.nuget.org/packages?q=OpinionatedEventing',
          label: 'NuGet',
          position: 'left',
        },
        {
          href: 'https://github.com/SierraNL/OpinionatedEventing',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Getting Started', to: '/docs/getting-started'},
            {label: 'Commands vs Events', to: '/docs/commands-vs-events'},
            {label: 'Outbox Pattern', to: '/docs/outbox-pattern'},
            {label: 'Saga Orchestration', to: '/docs/sagas-orchestration'},
          ],
        },
        {
          title: 'Packages',
          items: [
            {label: 'OpinionatedEventing', href: 'https://www.nuget.org/packages/OpinionatedEventing'},
            {label: 'OpinionatedEventing.Abstractions', href: 'https://www.nuget.org/packages/OpinionatedEventing.Abstractions'},
            {label: 'OpinionatedEventing.Sagas', href: 'https://www.nuget.org/packages/OpinionatedEventing.Sagas'},
            {label: 'All packages →', href: 'https://www.nuget.org/packages?q=OpinionatedEventing'},
          ],
        },
        {
          title: 'Links',
          items: [
            {label: 'GitHub', href: 'https://github.com/SierraNL/OpinionatedEventing'},
            {label: 'Issues', href: 'https://github.com/SierraNL/OpinionatedEventing/issues'},
            {label: 'Releases', href: 'https://github.com/SierraNL/OpinionatedEventing/releases'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} OpinionatedEventing contributors. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['csharp', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

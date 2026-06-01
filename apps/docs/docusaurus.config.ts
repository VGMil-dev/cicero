import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Cicero',
  tagline: 'Arquitectura, decisiones y estado de transicion',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://vgmil-dev.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/cicero/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'VGMil-dev',
  projectName: 'cicero',

  onBrokenLinks: 'throw',

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/VGMil-dev/cicero/edit/main/docs/',
        },
        blog: {
          showReadingTime: true,
          path: 'bitacora',
          routeBasePath: 'bitacora',
          blogTitle: 'Bitácora de Decisiones',
          blogDescription: 'Historial de la evolución arquitectónica y técnica de Cicero',
          blogSidebarTitle: 'Todas las decisiones',
          blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    mermaid: {
      theme: {light: 'neutral', dark: 'neutral'},
    },
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Cicero',
      logo: {
        alt: 'Cicero Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Documentacion',
        },
        {
          to: '/bitacora',
          label: 'Bitácora',
          position: 'left',
        },
        {
          href: 'https://github.com/VGMil-dev/cicero',
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
            {
              label: 'Introduccion',
              to: '/docs/intro',
            },
            {
              label: 'Arquitectura',
              to: '/docs/arquitectura',
            },
          ],
        },
        {
          title: 'Bitacora',
          items: [
            {
              label: 'Decisiones',
              to: '/bitacora',
            },
          ],
        },
        {
          title: 'Proyecto',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/VGMil-dev/cicero',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Cicero.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

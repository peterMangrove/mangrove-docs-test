// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const simplePlantUML = require("@akebifiky/remark-simple-plantuml");

/** @type {import('@docusaurus/types').Config} */
const config = {
  
  title: 'Mangrove docs',
  tagline: 'Mangrove documentation',
  url: 'https://testnet.mangrove.exchange',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/assets/mangrove_logo.png',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'Mangrove', // Usually your GitHub org/user name.
  projectName: 'Mangrove', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    '@docusaurus-terminology/parser',
    require.resolve('docusaurus-lunr-search'),
    '@vegaprotocol/docusaurus-theme-github-codeblock',
    
  ],
  staticDirectories: ['static'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          remarkPlugins: [simplePlantUML]
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    ({
      docs: {
        sidebar: {
          hideable: true,
        },
      },
      prism: {
        additionalLanguages: ['solidity'],
      },
      navbar: {
        title: 'Mangrove docs',
        logo: {
          alt: 'My Site Logo',
          src: 'img/assets/mangrove_logo.png',
        },
        items: [
          {
            to: '/docs/mangrove-core/core',
            position: 'left',
            label: 'Contracts',
          },
          {
            to: '/docs/mangrove-js/sdk',
            position: 'left',
            label: 'SDK',
          },
          {
            href: 'https://github.com/mangrovedao',
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
                label: 'Contracts',
                to: '/docs/mangrove-core/README.md',
              },
              {
                label: 'SDK',
                to: '/docs/mangrove-js/README.md',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Telegram',
                href: 'https://t.me/MangroveDAO',
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/fuSuPC2G',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/mangrovedao',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/mangrovedao',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Mangrove, Inc. Built with Docusaurus.`,
      },
      
    }),
};

module.exports = config;

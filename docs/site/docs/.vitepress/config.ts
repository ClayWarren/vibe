import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'VCL',
  description: 'Vibe Coding Language',
  vite: {
    ssr: {
      noExternal: ['vitepress']
    }
  },
  themeConfig: {
    nav: [
      { text: 'Handbook', link: '/handbook/' },
      { text: 'Reference', link: '/reference/' },
      { text: 'Guides', link: '/guides/' },
      { text: 'Playground', link: '/playground' },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar: {
      '/handbook/': [
        {
          text: 'Handbook',
          items: [
            { text: 'Overview', link: '/handbook/' },
            { text: 'Everyday VCL', link: '/handbook/everyday-vcl' },
            { text: 'Effects & Runtime', link: '/handbook/effects-runtime' },
            { text: 'Modules & Registry', link: '/handbook/modules' },
            { text: 'Tooling & Workflow', link: '/handbook/tooling' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Overview', link: '/reference/' },
            { text: 'Language Spec', link: '/spec' },
            { text: 'Stdlib', link: '/stdlib' },
            { text: 'Runtime', link: '/runtime' },
            { text: 'VM', link: '/vm' },
            { text: 'CLI', link: '/cli' },
          ],
        },
      ],
      '/guides/': [
        {
          text: 'Guides',
          items: [
            { text: 'Overview', link: '/guides/' },
            { text: 'Quickstart', link: '/quickstart' },
            { text: 'Playground', link: '/playground' },
            { text: 'Next.js Adapter (coming soon)', link: '/guides/nextjs' },
            { text: 'CLI Workflows', link: '/cli' },
          ],
        },
      ],
      '/': [
        {
          text: 'Legacy & Reference',
          items: [
            { text: 'Quickstart', link: '/quickstart' },
            { text: 'CLI', link: '/cli' },
            { text: 'Spec', link: '/spec' },
            { text: 'Stdlib', link: '/stdlib' },
            { text: 'Runtime', link: '/runtime' },
            { text: 'VM', link: '/vm' },
            { text: 'Playground', link: '/playground' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/claywarren/vibe' }],
  },
})

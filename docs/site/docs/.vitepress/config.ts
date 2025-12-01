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
      { text: 'Docs', link: '/index' },
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'Spec', link: '/spec' },
      { text: 'Stdlib', link: '/stdlib' },
      { text: 'Runtime', link: '/runtime' },
      { text: 'Playground', link: '/playground' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Quickstart', link: '/quickstart' },
          { text: 'CLI', link: '/cli' },
          { text: 'VM', link: '/vm' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Language Spec', link: '/spec' },
          { text: 'Stdlib', link: '/stdlib' },
          { text: 'Runtime', link: '/runtime' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/claywarren/vibe' }],
  },
})

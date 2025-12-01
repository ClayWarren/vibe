import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import CopyForLLM from './components/CopyForLLM.vue'

export default {
  ...DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(CopyForLLM)
    })
  }
}

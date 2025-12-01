<script setup>
import { computed, ref } from 'vue'
import { useData } from 'vitepress'

// Eagerly import all markdown sources as raw text
// Path: from .vitepress/theme/components -> ../../../docs
const rawSources = import.meta.glob('../../../docs/**/*.md', { as: 'raw', eager: true })

const { page } = useData()
const copying = ref(false)
const copied = ref(false)
const error = ref('')

const markdown = computed(() => {
  const rel = page.value?.relativePath || ''
  const key = `../../../docs/${rel}`
  return rawSources[key] || ''
})

async function copy() {
  error.value = ''
  copied.value = false
  copying.value = true
  try {
    const text = markdown.value
    if (!text) throw new Error('No markdown available for this page')
    await navigator.clipboard.writeText(text)
    copied.value = true
  } catch (e) {
    error.value = e?.message ?? 'Unable to copy'
  } finally {
    copying.value = false
  }
}
</script>

<template>
  <ClientOnly>
    <div class="copy-llm" role="group" aria-label="Copy page as Markdown for LLMs">
      <button class="copy-llm__btn" type="button" @click="copy" :disabled="copying || !markdown">
        <span v-if="!copied">Copy as Markdown for LLMs</span>
        <span v-else>Copied!</span>
      </button>
      <span v-if="!markdown" class="copy-llm__error">Markdown not found for this page.</span>
      <span v-else-if="error" class="copy-llm__error">{{ error }}</span>
    </div>
  </ClientOnly>
</template>

<style scoped>
.copy-llm {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0 0.25rem;
}
.copy-llm__btn {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border-radius: 8px;
  padding: 0.4rem 0.9rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}
.copy-llm__btn:hover:enabled {
  background: var(--vp-c-bg-alt);
}
.copy-llm__btn:active:enabled {
  transform: translateY(1px);
}
.copy-llm__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.copy-llm__error {
  color: var(--vp-c-danger-1, #d14);
  font-size: 0.9rem;
}
</style>

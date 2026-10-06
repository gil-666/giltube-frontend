<script lang="ts">
// Renders the tree produced by app/utils/newsMarkdown.ts as real elements.
// Nothing is injected as HTML: every node becomes a vnode, and links in the
// tree were already validated by the parser.
import { computed, defineComponent, h, type PropType, type VNodeChild } from 'vue'
import { NuxtLink } from '#components'
import { useLocalePath } from '#i18n'
import { parseMarkdown, type MarkdownBlock, type MarkdownInline } from '~/app/utils/newsMarkdown'

export default defineComponent({
  name: 'NewsMarkdown',
  props: {
    source: { type: String, default: '' },
    compact: { type: Boolean, default: false },
  },
  emits: ['internal-link'],
  setup(props, { emit }) {
    const localePath = useLocalePath()
    const blocks = computed(() => parseMarkdown(props.source || ''))

    const linkClass = 'font-medium text-accent-400 underline decoration-accent-400/40 underline-offset-2 transition hover:text-accent-300 hover:decoration-accent-300'

    const inline = (nodes: MarkdownInline[]): VNodeChild[] => nodes.map((node) => {
      switch (node.type) {
        case 'text': return node.text
        case 'br': return h('br')
        case 'strong': return h('strong', { class: 'font-semibold text-white' }, inline(node.children))
        case 'em': return h('em', { class: 'italic' }, inline(node.children))
        case 'strike': return h('s', { class: 'text-zinc-500' }, inline(node.children))
        case 'code': return h('code', { class: 'rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-100' }, node.text)
        case 'link':
          if (node.external) {
            return h('a', { href: node.href, target: '_blank', rel: 'noopener noreferrer', class: linkClass }, inline(node.children))
          }
          return h(NuxtLink, { to: localePath(node.href), class: linkClass, onClick: () => emit('internal-link', node.href) }, () => inline(node.children))
        default: return null
      }
    })

    const headingClasses = ['', 'text-xl font-bold', 'text-lg font-semibold', 'text-base font-semibold']

    const block = (node: MarkdownBlock, index: number): VNodeChild => {
      const key = index
      switch (node.type) {
        case 'heading':
          return h(`h${node.level + 1}`, { key, class: `${headingClasses[node.level]} tracking-tight text-white` }, inline(node.children))
        case 'paragraph':
          return h('p', { key }, inline(node.children))
        case 'quote':
          return h('blockquote', { key, class: 'border-l-2 border-zinc-600 pl-4 italic text-zinc-400' }, inline(node.children))
        case 'list':
          return h(node.ordered ? 'ol' : 'ul', { key, class: `${node.ordered ? 'list-decimal' : 'list-disc'} space-y-1 pl-6 marker:text-zinc-500` },
            node.items.map((item, itemIndex) => h('li', { key: itemIndex }, inline(item))))
        case 'code':
          return h('pre', { key, class: 'overflow-x-auto rounded-lg border border-white/[0.07] bg-zinc-950 p-3 font-mono text-sm leading-relaxed text-zinc-200' }, h('code', node.text))
        case 'hr':
          return h('hr', { key, class: 'border-white/10' })
        default:
          return null
      }
    }

    return () => h('div', {
      class: ['news-markdown break-words text-zinc-300', props.compact ? 'space-y-2 text-sm leading-6' : 'space-y-3 text-[15px] leading-7'],
    }, blocks.value.map(block))
  },
})
</script>

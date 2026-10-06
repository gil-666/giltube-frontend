import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import { safeMarkdownHref } from '~/app/utils/newsMarkdown'
import type { NewsItem } from '~/app/service/news'

export interface NewsCtaLink {
  /** Localized path for internal targets, the URL itself for external ones. */
  to: string
  external: boolean
  label: string
}

/** Resolves and follows a news item's call to action. */
export const useNewsCta = () => {
  const router = useRouter()
  const localePath = useLocalePath()
  const { t } = useI18n()

  const ctaOf = (item: Pick<NewsItem, 'cta_kind' | 'cta_label' | 'cta_target'> | null | undefined): NewsCtaLink | null => {
    if (!item || item.cta_kind === 'none' || !item.cta_target) return null
    // Reuse the Markdown link check so a bad target never becomes a link.
    const target = safeMarkdownHref(item.cta_target)
    if (!target || target.external !== (item.cta_kind === 'external')) return null
    return {
      to: target.external ? target.href : localePath(target.href),
      external: target.external,
      label: item.cta_label?.trim() || t('news.learnMore'),
    }
  }

  const follow = async (link: NewsCtaLink) => {
    if (link.external) {
      window.open(link.to, '_blank', 'noopener,noreferrer')
      return
    }
    await router.push(link.to)
  }

  return { ctaOf, follow }
}

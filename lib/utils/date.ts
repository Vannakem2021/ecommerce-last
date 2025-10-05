// Date utility functions

type TranslationFunction = (key: string, values?: Record<string, any>) => string

export function getRelativeTimeString(date: Date, t?: TranslationFunction): string {
  const now = new Date()
  const diffInMs = now.getTime() - new Date(date).getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (!t) {
    // Fallback to English if no translation function provided
    if (diffInDays === 0) {
      return 'Just added'
    } else if (diffInDays === 1) {
      return '1 day ago'
    } else if (diffInDays <= 7) {
      return `${diffInDays} days ago`
    } else if (diffInDays <= 30) {
      const weeks = Math.floor(diffInDays / 7)
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
    } else if (diffInDays <= 60) {
      return '1 month ago'
    } else {
      const months = Math.floor(diffInDays / 30)
      return `${months} months ago`
    }
  }

  // Use translations
  if (diffInDays === 0) {
    return t('Just added')
  } else if (diffInDays === 1) {
    return t('1 day ago')
  } else if (diffInDays <= 7) {
    return `${diffInDays} ${t('days ago')}`
  } else if (diffInDays <= 30) {
    const weeks = Math.floor(diffInDays / 7)
    return weeks === 1 ? t('1 week ago') : `${weeks} ${t('weeks ago')}`
  } else if (diffInDays <= 60) {
    return t('1 month ago')
  } else {
    const months = Math.floor(diffInDays / 30)
    return `${months} ${t('months ago')}`
  }
}

export function isNew(createdAt: Date | string): boolean {
  const date = new Date(createdAt)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  // Consider products created within 30 days as "new"
  return diffInDays <= 30
}

export function formatSalesCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

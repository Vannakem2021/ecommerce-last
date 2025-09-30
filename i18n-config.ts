export const i18n = {
  locales: [
    {
      code: 'en-US',
      name: 'English',
      flag: '🇬🇧' // UK flag emoji
    },
    {
      code: 'kh',
      name: 'ខ្មែរ',
      flag: '🇰🇭' // Cambodia flag emoji
    },
  ],
  defaultLocale: 'en-US',
}

export const getDirection = (locale: string) => {
  return 'ltr'
}
export type I18nConfig = typeof i18n
export type Locale = I18nConfig['locales'][number]

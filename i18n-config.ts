export const i18n = {
  locales: [
    {
      code: 'en-US',
      name: 'English',
      flag: {
        src: 'https://flagcdn.com/24x18/gb-eng.png',
        srcset: 'https://flagcdn.com/24x18/gb-eng.png 1x, https://flagcdn.com/48x36/gb-eng.png 2x, https://flagcdn.com/72x54/gb-eng.png 3x',
        width: 24,
        height: 18,
        alt: 'England flag'
      }
    },
    {
      code: 'kh',
      name: 'ខ្មែរ',
      flag: {
        src: 'https://flagcdn.com/24x18/kh.png',
        srcset: 'https://flagcdn.com/24x18/kh.png 1x, https://flagcdn.com/48x36/kh.png 2x, https://flagcdn.com/72x54/kh.png 3x',
        width: 24,
        height: 18,
        alt: 'Cambodia flag'
      }
    },
  ],
  defaultLocale: 'en-US',
}

export const getDirection = (locale: string) => {
  return 'ltr'
}
export type I18nConfig = typeof i18n
export type Locale = I18nConfig['locales'][number]

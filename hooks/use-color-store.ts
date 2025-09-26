/* eslint-disable @typescript-eslint/no-empty-object-type */
// first copy theme color from https://ui.shadcn.com/themes
// then in chatgpt:
// PROMPT: convert this css to js object. don't convert css variable to cameCase

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ColorState = {
  availableColors: {
    name: string
    root: {}
    dark: {}
  }[]
  defaultColor: string
  userColor?: string
}
const availableColors = [
  {
    name: 'Green',
    root: {
      '--background': '0 0% 100%',
      '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '240 10% 3.9%',
      '--primary': '142.1 76.2% 36.3%',
      '--primary-foreground': '355.7 100% 97.3%',
      '--secondary': '240 4.8% 95.9%',
      '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%',
      '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%',
      '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%',
      '--input': '240 5.9% 90%',
      '--ring': '142.1 76.2% 36.3%',
      '--radius': '0.5rem',
      '--chart-1': '12 76% 61%',
      '--chart-2': '173 58% 39%',
      '--chart-3': '197 37% 24%',
      '--chart-4': '43 74% 66%',
      '--chart-5': '27 87% 67%',
    },
    dark: {
      '--background': '220 15% 8%',
      '--foreground': '60 9.1% 97.8%',
      '--card': '220 15% 10%',
      '--card-foreground': '60 9.1% 97.8%',
      '--popover': '220 15% 10%',
      '--popover-foreground': '60 9.1% 97.8%',
      '--primary': '142.1 70.6% 45.3%',
      '--primary-foreground': '144.9 80.4% 10%',
      '--secondary': '220 10% 12%',
      '--secondary-foreground': '60 9.1% 97.8%',
      '--muted': '220 10% 12%',
      '--muted-foreground': '24 5.4% 63.9%',
      '--accent': '220 10% 12%',
      '--accent-foreground': '60 9.1% 97.8%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '60 9.1% 97.8%',
      '--border': '220 10% 15%',
      '--input': '220 10% 12%',
      '--ring': '142.4 71.8% 29.2%',
      '--chart-1': '220 70% 50%',
      '--chart-2': '160 60% 45%',
      '--chart-3': '30 80% 55%',
      '--chart-4': '280 65% 60%',
      '--chart-5': '340 75% 55%',
    },
  },
]
const initialState: ColorState = {
  availableColors,
  defaultColor: 'Green',
  userColor: undefined,
}
export const colorStore = create<ColorState>()(
  persist(() => initialState, {
    name: 'colorStore',
  })
)

export default function useColorStore(theme: string = 'light') {
  const colorState = colorStore()
  const getColor = () => {
    const userColor = colorState.availableColors.find(
      (t) => t.name === colorState.userColor
    )
    if (userColor) return userColor
    const defaultColor = colorState.availableColors.find(
      (t) => t.name === colorState.defaultColor
    )
    if (defaultColor) return defaultColor

    return colorState.availableColors[0]
  }

  const color = getColor()
  const cssColors: { [key: string]: string } =
    theme === 'light' ? color.root : color.dark
  return {
    availableColors,
    cssColors,
    color,
    getColor,
    setColor: (name: string, isUserColor?: boolean) => {
      colorStore.setState(
        isUserColor ? { userColor: name } : { defaultColor: name }
      )
    },
    updateCssVariables: () => {
      const color = getColor()
      const colors: { [key: string]: string } =
        theme === 'light' ? color.root : color.dark
      for (const key in colors) {
        document.documentElement.style.setProperty(key, colors[key])
      }
    },
  }
}

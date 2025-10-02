/* eslint-disable no-unused-vars */

import data from '@/lib/data'
import { ClientSetting, SiteCurrency } from '@/types'
import { create } from 'zustand'
import Cookies from 'js-cookie'

interface SettingState {
  setting: ClientSetting
  setSetting: (newSetting: ClientSetting) => void
  getCurrency: () => SiteCurrency
  setCurrency: (currencyCode: string) => void
}

const useSettingStore = create<SettingState>((set, get) => ({
  setting: {
    ...data.settings[0],
    currency: typeof window !== 'undefined'
      ? (Cookies.get('currency') || data.settings[0].defaultCurrency)
      : data.settings[0].defaultCurrency,
  } as ClientSetting,
  setSetting: (newSetting: ClientSetting) => {
    set({
      setting: {
        ...newSetting,
        currency: newSetting.currency || get().setting.currency,
      },
    })
  },
  getCurrency: () => {
    const currentCurrencyCode = get().setting.currency
    const currency = get().setting.availableCurrencies.find(
      (c) => c.code === currentCurrencyCode
    )
    return currency || get().setting.availableCurrencies[0]
  },
  setCurrency: (currencyCode: string) => {
    const currency = get().setting.availableCurrencies.find(
      (c) => c.code === currencyCode
    )
    if (currency) {
      // Save to cookie
      Cookies.set('currency', currencyCode, { expires: 365 })
      // Update state
      set({
        setting: {
          ...get().setting,
          currency: currencyCode,
        },
      })
    }
  },
}))

export default useSettingStore

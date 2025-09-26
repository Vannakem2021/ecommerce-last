/* eslint-disable no-unused-vars */

import data from '@/lib/data'
import { ClientSetting, SiteCurrency } from '@/types'
import { create } from 'zustand'

interface SettingState {
  setting: ClientSetting
  setSetting: (newSetting: ClientSetting) => void
  getCurrency: () => SiteCurrency
}

const useSettingStore = create<SettingState>((set, get) => ({
  setting: {
    ...data.settings[0],
    currency: data.settings[0].defaultCurrency,
  } as ClientSetting,
  setSetting: (newSetting: ClientSetting) => {
    set({
      setting: {
        ...newSetting,
        currency: data.settings[0].defaultCurrency, // Always keep USD
      },
    })
  },
  getCurrency: () => {
    return get().setting.availableCurrencies[0] // Always return first (USD)
  },
}))

export default useSettingStore

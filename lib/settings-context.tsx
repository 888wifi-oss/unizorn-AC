"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type DateFormat = "short" | "medium" | "long"
export type YearType = "buddhist" | "christian"

// Add new types for currency settings
export type Currency = "THB" | "USD" | "EUR" | "JPY" | "GBP";

export interface Settings {
  dateFormat: DateFormat
  yearType: YearType
  commonFeeRate: number
  currency: Currency;
  showCurrencySymbol: boolean;
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  dateFormat: "medium",
  yearType: "buddhist",
  commonFeeRate: 40,
  currency: "THB",
  showCurrencySymbol: true,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("condo-pro-settings")
    if (stored) {
      try {
        const parsedSettings = JSON.parse(stored)
        // Merge with default settings to avoid missing properties on first load after update
        setSettings(prev => ({...defaultSettings, ...parsedSettings}))
      } catch (e) {
        console.error("Failed to parse settings:", e)
        // If parsing fails, stick with default settings
        setSettings(defaultSettings)
      }
    }
  }, [])

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }
      localStorage.setItem("condo-pro-settings", JSON.stringify(updated))
      return updated
    })
  }

  return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider")
  }
  return context
}


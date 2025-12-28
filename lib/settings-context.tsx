"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type DateFormat = "short" | "medium" | "long"
export type YearType = "buddhist" | "christian"

// Add new types for currency settings
export type Currency = "THB" | "USD" | "EUR" | "JPY" | "GBP";

export interface InvoiceSettings {
  companyName: string;
  address: string;
  taxId: string;
  logoUrl: string;
  accentColor: string;
  copyCount: number; // 1 = Original only, 2 = Original + Copy side-by-side
  headerText: {
    invoice: { th: string; en: string };
    receipt: { th: string; en: string };
  };
  note: string;
}

export interface Settings {
  dateFormat: DateFormat
  yearType: YearType
  commonFeeRate: number
  currency: Currency;
  showCurrencySymbol: boolean;
  invoice: InvoiceSettings;
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
  invoice: {
    companyName: "นิติบุคคลอาคารชุด พลัส 67 คอนโดมิเนียม",
    address: "71 ซอยสุขุมวิท 67 (ศรีจันทร์) แขวงพระโขนงเหนือ เขตวัฒนา กรุงเทพมหานคร 10110",
    taxId: "0994000148071",
    logoUrl: "",
    accentColor: "#000000",
    copyCount: 2,
    headerText: {
      invoice: { th: "ใบแจังหนี้", en: "Invoice" },
      receipt: { th: "ใบเสร็จรับเงิน", en: "Receipt" },
    },
    note: "",
  },
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
        // Deep merge for invoice settings to ensure new fields are added to existing settings
        const mergedSettings = {
          ...defaultSettings,
          ...parsedSettings,
          invoice: {
            ...defaultSettings.invoice,
            ...(parsedSettings.invoice || {})
          }
        }
        setSettings(mergedSettings)
      } catch (e) {
        console.error("Failed to parse settings:", e)
        // If parsing fails, stick with default settings
        setSettings(defaultSettings)
      }
    }
  }, [])

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      // Deep merge for invoice settings if they are being updated
      let updated: Settings;

      if (newSettings.invoice) {
        updated = {
          ...prev,
          ...newSettings,
          invoice: {
            ...prev.invoice,
            ...newSettings.invoice
          }
        };
      } else {
        updated = { ...prev, ...newSettings } as Settings;
      }

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


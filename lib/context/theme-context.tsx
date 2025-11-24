"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'dark'

export interface ThemeSettings {
  color: ThemeColor
  profileAvatar?: string
  welcomeMessage?: string
  darkMode?: boolean
}

interface ThemeContextType {
  theme: ThemeColor
  settings: ThemeSettings
  setTheme: (color: ThemeColor) => void
  setProfileAvatar: (avatar: string) => void
  setWelcomeMessage: (message: string) => void
  setDarkMode: (enabled: boolean) => void
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'portal-theme-settings'

const defaultSettings: ThemeSettings = {
  color: 'blue',
  profileAvatar: undefined,
  welcomeMessage: undefined,
  darkMode: false
}

const themeColors = {
  blue: {
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryText: 'text-blue-600',
    primaryBorder: 'border-blue-600',
    primaryLight: 'bg-blue-50',
    primaryTextLight: 'text-blue-600',
    primaryBg: 'bg-blue-600',
  },
  green: {
    primary: 'bg-green-600',
    primaryHover: 'hover:bg-green-700',
    primaryText: 'text-green-600',
    primaryBorder: 'border-green-600',
    primaryLight: 'bg-green-50',
    primaryTextLight: 'text-green-600',
    primaryBg: 'bg-green-600',
  },
  purple: {
    primary: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    primaryText: 'text-purple-600',
    primaryBorder: 'border-purple-600',
    primaryLight: 'bg-purple-50',
    primaryTextLight: 'text-purple-600',
    primaryBg: 'bg-purple-600',
  },
  orange: {
    primary: 'bg-orange-600',
    primaryHover: 'hover:bg-orange-700',
    primaryText: 'text-orange-600',
    primaryBorder: 'border-orange-600',
    primaryLight: 'bg-orange-50',
    primaryTextLight: 'text-orange-600',
    primaryBg: 'bg-orange-600',
  },
  pink: {
    primary: 'bg-pink-600',
    primaryHover: 'hover:bg-pink-700',
    primaryText: 'text-pink-600',
    primaryBorder: 'border-pink-600',
    primaryLight: 'bg-pink-50',
    primaryTextLight: 'text-pink-600',
    primaryBg: 'bg-pink-600',
  },
  dark: {
    primary: 'bg-gray-800',
    primaryHover: 'hover:bg-gray-900',
    primaryText: 'text-gray-800',
    primaryBorder: 'border-gray-800',
    primaryLight: 'bg-gray-100',
    primaryTextLight: 'text-gray-800',
    primaryBg: 'bg-gray-800',
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings)

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      if (saved) {
        try {
          setSettings(JSON.parse(saved))
        } catch (error) {
          console.error('Failed to load theme settings:', error)
        }
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  const updateSettings = (newSettings: ThemeSettings) => {
    setSettings(newSettings)
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newSettings))
    }
  }

  const setTheme = (color: ThemeColor) => {
    updateSettings({ ...settings, color })
    // Apply theme immediately
    applyTheme(color)
  }

  const setDarkMode = (enabled: boolean) => {
    const newSettings = { ...settings, darkMode: enabled }
    updateSettings(newSettings)
    
    // Apply dark mode to document
    if (typeof window !== 'undefined') {
      if (enabled) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!settings.darkMode)
  }
  
  // Apply theme on mount and when settings change
  useEffect(() => {
    applyTheme(settings.color)
  }, [settings.color])

  const setProfileAvatar = (avatar: string) => {
    updateSettings({ ...settings, profileAvatar: avatar })
  }

  const setWelcomeMessage = (message: string) => {
    updateSettings({ ...settings, welcomeMessage: message })
  }

  // Apply dark mode on mount and when dark mode setting changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (settings.darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [settings.darkMode])

  return (
    <ThemeContext.Provider value={{
      theme: settings.color,
      settings,
      setTheme,
      setProfileAvatar,
      setWelcomeMessage,
      setDarkMode,
      toggleDarkMode
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function getThemeClasses(color: ThemeColor) {
  return themeColors[color]
}

export function applyTheme(color: ThemeColor) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    const colors = themeColors[color]
    
    // Apply theme classes to root
    root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-pink', 'theme-dark')
    root.classList.add(`theme-${color}`)
    
    // Apply CSS custom properties dynamically
    root.style.setProperty('--primary-color', colors.primary)
    root.style.setProperty('--primary-hover', colors.primaryHover)
    root.style.setProperty('--primary-text', colors.primaryText)
    root.style.setProperty('--primary-border', colors.primaryBorder)
    
    // For now, we'll use a simpler approach - just store the color in localStorage
    // and let components use it directly via the theme context
    console.log('[Theme] Applied theme color:', color)
  }
}

export const AVAILABLE_THEMES: { color: ThemeColor; name: string; icon: string }[] = [
  { color: 'blue', name: 'สีฟ้า', icon: '🔵' },
  { color: 'green', name: 'สีเขียว', icon: '🟢' },
  { color: 'purple', name: 'สีม่วง', icon: '🟣' },
  { color: 'orange', name: 'สีส้ม', icon: '🟠' },
  { color: 'pink', name: 'สีชมพู', icon: '🌸' },
  { color: 'dark', name: 'โทนเข้ม', icon: '⚫' }
]

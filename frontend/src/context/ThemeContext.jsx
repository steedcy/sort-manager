import { createContext, useContext } from 'react'

export const ThemeContext = createContext({ theme: 'dark', toggle: () => {}, isDark: true })

export const useThemeContext = () => useContext(ThemeContext)

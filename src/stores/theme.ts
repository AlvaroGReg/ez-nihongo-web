import { shallowRef } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'ez-nihongo:theme:v1'

function getInitialTheme(): Theme {
    try {
        const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
        if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    } catch {
        // The browser may block local storage; use its color-scheme preference instead.
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const theme = shallowRef<Theme>(getInitialTheme())

function applyTheme(value: Theme): void {
    document.documentElement.dataset.theme = value
    document.documentElement.style.colorScheme = value
}

applyTheme(theme.value)

export function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme(theme.value)

    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme.value)
    } catch {
        // Keep the in-memory choice for this visit when storage is unavailable.
    }
}

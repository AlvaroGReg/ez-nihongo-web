import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('theme preference', () => {
    beforeEach(() => {
        window.localStorage.clear()
        document.documentElement.removeAttribute('data-theme')
        document.documentElement.style.removeProperty('color-scheme')
        vi.resetModules()
    })

    it('uses the browser color-scheme preference when no theme is saved', async () => {
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: vi.fn().mockReturnValue({ matches: true }),
        })

        const { theme } = await import('@/stores/theme')

        expect(theme.value).toBe('dark')
        expect(document.documentElement.dataset.theme).toBe('dark')
    })

    it('persists a manually selected theme', async () => {
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: vi.fn().mockReturnValue({ matches: false }),
        })

        const { theme, toggleTheme } = await import('@/stores/theme')
        toggleTheme()

        expect(theme.value).toBe('dark')
        expect(window.localStorage.getItem('ez-nihongo:theme:v1')).toBe('dark')
        expect(document.documentElement.dataset.theme).toBe('dark')
    })
})

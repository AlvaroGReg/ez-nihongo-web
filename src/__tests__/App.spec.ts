import { describe, it, expect, beforeEach } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'
import router from '../router'
import { auth } from '@/stores/auth'

describe('App', () => {
    beforeEach(() => auth.signOut())

    it('renders the application shell', () => {
        const wrapper = mount(App, {
            global: {
                plugins: [router],
                stubs: { RouterView: true },
            },
        })
        expect(wrapper.find('router-view-stub').exists()).toBe(true)
        expect(wrapper.get('nav').attributes('aria-label')).toBe('Application toolbar')
        expect(wrapper.get('a[href="#/auth"]').attributes('aria-label')).toBe(
            'Log in or create account',
        )
        expect(wrapper.get('.toolbar-actions').element.children[0]?.tagName).toBe('A')
        expect(wrapper.get('.toolbar-actions').element.children[1]?.tagName).toBe('LABEL')
        expect(wrapper.find('select').element).toBeDefined()
        expect(wrapper.find('button[aria-label="Switch to dark theme"]').element).toBeDefined()
    })

    it('shows the current account and signs out from the toolbar', async () => {
        auth.saveSession({
            user: { id: 'user-1', email: 'learner@example.com' },
            accessToken: 'access-token',
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
        })
        const wrapper = mount(App, {
            global: {
                plugins: [router],
                stubs: { RouterView: true },
            },
        })

        expect(wrapper.find('a[href="#/auth"]').exists()).toBe(false)
        await wrapper.get('button[aria-label="Log out"]').trigger('click')
        expect(auth.state.accessToken).toBeNull()
        expect(wrapper.find('a[href="#/auth"]').exists()).toBe(true)
    })

    it('opens the vertical navigation with links to exercises and dictionary', async () => {
        const wrapper = mount(App, {
            global: {
                plugins: [router],
                stubs: { RouterView: true },
            },
        })

        await wrapper.get('.menu-toggle').trigger('click')

        const brand = wrapper.get('.toolbar-brand img')
        expect(brand.attributes('src')).toMatch(/res\/logos\/ez-nihongo\/logo-horizontal-blue\.svg$/)
        expect(brand.attributes('alt')).toBe('EZ Nihongo')
        expect(wrapper.get('.navigation-menu a').attributes('href')).toBe('#/exercises')
        expect(wrapper.get('.dictionary-link').attributes('href')).toBe('#/dictionary')
        expect(wrapper.get('.navigation-menu a:last-child').attributes('href')).toBe('#/about')
        expect(wrapper.get('.navigation-menu a:last-child').text()).toBe('About')
    })

    it('switches the header logo variant with the theme', async () => {
        const wrapper = mount(App, {
            global: {
                plugins: [router],
                stubs: { RouterView: true },
            },
        })

        const brand = wrapper.get('.toolbar-brand img')
        expect(brand.attributes('src')).toMatch(/logo-horizontal-blue\.svg$/)

        await wrapper.get('button.theme-toggle').trigger('click')

        expect(brand.attributes('src')).toMatch(/logo-horizontal-white\.svg$/)
    })

    it('keeps the floating shortcut available and links to About', () => {
        const wrapper = mount(App, {
            global: {
                plugins: [router],
                stubs: { RouterView: true },
            },
        })

        const shortcut = wrapper.get('.floating-contact-link')
        expect(shortcut.attributes('href')).toBe('#/about')
        expect(shortcut.get('img').attributes('src')).toMatch(/res\/logos\/agreg_blue\.png$/)
    })
})

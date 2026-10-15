import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'
import router from '../router'

describe('App', () => {
    it('renders the application shell', () => {
        const wrapper = mount(App, {
            global: {
                plugins: [router],
                stubs: { RouterView: true },
            },
        })
        expect(wrapper.find('router-view-stub').exists()).toBe(true)
        expect(wrapper.get('nav').attributes('aria-label')).toBe('Application toolbar')
        expect(wrapper.get('.account-icon-button').attributes('aria-label')).toBe(
            'Log in or create account',
        )
        expect(wrapper.find('select').element).toBeDefined()
        expect(wrapper.find('button[aria-label="Switch to dark theme"]').element).toBeDefined()
    })

    it('opens the vertical navigation with links to exercises and dictionary', async () => {
        const wrapper = mount(App, {
            global: {
                plugins: [router],
                stubs: { RouterView: true },
            },
        })

        await wrapper.get('.menu-toggle').trigger('click')

        expect(wrapper.get('.toolbar-brand').text()).toBe('EZ Nihongo')
        expect(wrapper.get('.navigation-menu a').attributes('href')).toBe('#/exercises')
        expect(wrapper.get('.dictionary-link').attributes('href')).toBe('#/dictionary')
    })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import ProgressView from '@/views/ProgressView.vue'
import { auth } from '@/stores/auth'

describe('ProgressView', () => {
    beforeEach(() => auth.signOut())

    it('shows one exercise progress panel at a time and switches tabs accessibly', async () => {
        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                { path: '/', component: ProgressView },
                { path: '/auth', component: { template: '<div />' } },
            ],
        })
        await router.push('/')
        await router.isReady()

        const wrapper = mount(ProgressView, { global: { plugins: [router] } })

        expect(wrapper.findAll('[role="tab"]')).toHaveLength(3)
        expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(1)
        expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Vocabulary')

        await wrapper.get('#progress-tab-kanji').trigger('click')
        expect(wrapper.get('[role="tabpanel"]').attributes('id')).toBe('progress-panel-kanji')
        expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Kanji')

        await wrapper.get('#progress-tab-kana').trigger('click')
        expect(wrapper.get('[role="tabpanel"]').attributes('id')).toBe('progress-panel-kana')
    })
})

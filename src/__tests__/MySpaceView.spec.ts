import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import MySpaceView from '@/views/MySpaceView.vue'
import { auth } from '@/stores/auth'

describe('MySpaceView', () => {
    beforeEach(() => {
        auth.state.user = { id: 'user-1', email: 'learner@example.com' }
        auth.state.accessToken = 'access-token'
    })

    it('shows links to exercise progress and personal vocabulary', async () => {
        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                { path: '/', component: MySpaceView },
                { path: '/progress', component: { template: '<div />' } },
                { path: '/my-vocabulary', component: { template: '<div />' } },
            ],
        })
        await router.push('/')
        await router.isReady()

        const wrapper = mount(MySpaceView, { global: { plugins: [router] } })

        expect(wrapper.get('h1').text()).toBe('My space')
        expect(wrapper.get('a[href="/progress"] h2').text()).toBe('Exercise progress')
        expect(wrapper.get('a[href="/my-vocabulary"] h2').text()).toBe('My vocabulary')
        expect(wrapper.get('button').text()).toBe('Log out')
    })
})

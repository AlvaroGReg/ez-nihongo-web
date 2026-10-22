import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { AuthSession } from '@/services/authApi'
import { auth } from '@/stores/auth'
import AuthView from '@/views/AuthView.vue'

const { authenticateMock } = vi.hoisted(() => ({ authenticateMock: vi.fn() }))

vi.mock('@/services/authApi', async (importOriginal) => {
    const original = await importOriginal<typeof import('@/services/authApi')>()
    return { ...original, authenticate: authenticateMock }
})

const session: AuthSession = {
    user: { id: 'user-1', email: 'learner@example.com' },
    accessToken: 'access-token',
    tokenType: 'Bearer',
    expiresAt: '2099-01-01T00:00:00Z',
}

async function mountAuthView(mode?: string) {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/auth', component: AuthView },
            { path: '/', component: AuthView },
        ],
    })
    await router.push(mode ? `/auth?mode=${mode}` : '/auth')
    await router.isReady()
    return mount(AuthView, { global: { plugins: [router] } })
}

describe('AuthView', () => {
    beforeEach(() => {
        authenticateMock.mockReset().mockResolvedValue(session)
        auth.state.user = null
        auth.state.accessToken = null
        auth.state.tokenType = null
        auth.state.expiresAt = null
    })

    it('shows an unchecked remember option only for login and sends its value', async () => {
        const wrapper = await mountAuthView()
        const rememberMe = wrapper.get('input[name="rememberMe"]')
        expect((rememberMe.element as HTMLInputElement).checked).toBe(false)

        await wrapper.get('input[type="email"]').setValue('learner@example.com')
        await wrapper.get('input[type="password"]').setValue('My-Pass1!')
        await rememberMe.setValue(true)
        await wrapper.get('form').trigger('submit')
        await flushPromises()

        expect(authenticateMock).toHaveBeenCalledWith('login', 'learner@example.com', 'My-Pass1!', true)
        expect((wrapper.get('input[type="password"]').element as HTMLInputElement).value).toBe('')
    })

    it('does not show the remember option during registration', async () => {
        const wrapper = await mountAuthView('register')
        expect(wrapper.find('input[name="rememberMe"]').exists()).toBe(false)
    })
})

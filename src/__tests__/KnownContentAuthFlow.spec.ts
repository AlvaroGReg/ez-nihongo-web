import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import type { AuthSession } from '@/services/authApi'
import AuthView from '@/views/AuthView.vue'
import router from '@/router'
import { auth } from '@/stores/auth'

const { authenticateMock, refreshAuthenticationMock } = vi.hoisted(() => ({
    authenticateMock: vi.fn(),
    refreshAuthenticationMock: vi.fn(),
}))

vi.mock('@/services/authApi', async (importOriginal) => {
    const original = await importOriginal<typeof import('@/services/authApi')>()
    return {
        ...original,
        authenticate: authenticateMock,
        refreshAuthentication: refreshAuthenticationMock,
    }
})

const session: AuthSession = {
    user: { id: 'user-1', email: 'learner@example.com' },
    accessToken: 'access-token',
    tokenType: 'Bearer',
    expiresAt: '2099-01-01T00:00:00Z',
}

describe('known content authentication return flow', () => {
    beforeEach(async () => {
        authenticateMock.mockReset().mockResolvedValue(session)
        refreshAuthenticationMock.mockReset().mockResolvedValue(null)
        auth.state.user = null
        auth.state.accessToken = null
        auth.state.tokenType = null
        auth.state.expiresAt = null
        await router.push('/auth?redirect=%2Fknown-content')
        await router.isReady()
    })

    it('keeps the newly authenticated in-memory session when returning to known content', async () => {
        const wrapper = mount(AuthView, { global: { plugins: [router] } })
        await wrapper.get('input[type="email"]').setValue('learner@example.com')
        await wrapper.get('input[type="password"]').setValue('My-Pass1!')
        await wrapper.get('form').trigger('submit')
        await flushPromises()

        expect(router.currentRoute.value.path).toBe('/known-content')
        expect(auth.state.accessToken).toBe(session.accessToken)
        expect(refreshAuthenticationMock).not.toHaveBeenCalled()
    })
})

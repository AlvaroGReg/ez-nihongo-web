import { beforeEach, describe, expect, it, vi } from 'vitest'

import { refreshAuthentication, revokeAuthentication } from '@/services/authApi'
import { auth } from '@/stores/auth'

vi.mock('@/services/authApi', () => ({
    refreshAuthentication: vi.fn(),
    revokeAuthentication: vi.fn(),
}))

const session = {
    user: { id: 'user-1', email: 'learner@example.com' },
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresAt: '2099-01-01T00:00:00Z',
}

describe('authentication state', () => {
    beforeEach(() => {
        auth.state.user = null
        auth.state.accessToken = null
        auth.state.tokenType = null
        auth.state.expiresAt = null
        vi.mocked(refreshAuthentication).mockReset()
        vi.mocked(revokeAuthentication).mockReset()
        vi.mocked(revokeAuthentication).mockResolvedValue()
        window.localStorage.clear()
    })

    it('restores a session through the refresh endpoint into memory', async () => {
        window.localStorage.setItem(
            'ez-nihongo:auth-session:v1',
            JSON.stringify({ ...session, accessToken: 'old-token' }),
        )
        vi.mocked(refreshAuthentication).mockResolvedValue(session)

        await auth.restoreSession()

        expect(auth.state.user).toEqual(session.user)
        expect(auth.state.accessToken).toBe(session.accessToken)
        expect(window.localStorage.length).toBe(0)
    })

    it('keeps newly authenticated access tokens out of browser storage', () => {
        auth.saveSession(session)

        expect(window.localStorage.length).toBe(0)
        expect(auth.state.accessToken).toBe(session.accessToken)
    })

    it('continues anonymously when the persistent session is invalid', async () => {
        vi.mocked(refreshAuthentication).mockResolvedValue(null)

        await auth.restoreSession()

        expect(auth.state.user).toBeNull()
        expect(auth.state.accessToken).toBeNull()
    })

    it('immediately clears memory and revokes the server session on sign out', async () => {
        auth.saveSession(session)
        vi.mocked(revokeAuthentication).mockRejectedValue(new Error('offline'))

        await expect(auth.signOut()).resolves.toBeUndefined()

        expect(auth.state.user).toBeNull()
        expect(auth.state.accessToken).toBeNull()
        expect(revokeAuthentication).toHaveBeenCalledOnce()
    })
})

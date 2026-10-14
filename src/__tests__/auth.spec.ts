import { beforeEach, describe, expect, it } from 'vitest'

import { auth, AUTH_SESSION_KEY } from '@/stores/auth'

const session = {
    user: { id: 'user-1', email: 'learner@example.com' },
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresAt: '2099-01-01T00:00:00Z',
}

describe('authentication state', () => {
    beforeEach(() => {
        auth.signOut()
        window.localStorage.clear()
    })

    it('persists and restores a valid session', () => {
        window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
        auth.restoreSession()

        expect(auth.state.user).toEqual(session.user)
        expect(auth.state.accessToken).toBe(session.accessToken)
    })

    it('discards expired sessions', () => {
        window.localStorage.setItem(
            AUTH_SESSION_KEY,
            JSON.stringify({ ...session, expiresAt: '2000-01-01T00:00:00Z' }),
        )

        auth.restoreSession()

        expect(auth.state.user).toBeNull()
        expect(window.localStorage.getItem(AUTH_SESSION_KEY)).toBeNull()
    })
})

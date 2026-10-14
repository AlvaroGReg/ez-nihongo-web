import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authenticate, AuthApiError } from '@/services/authApi'

describe('authentication API', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it('sends credentials to the requested auth endpoint and returns the session', async () => {
        const session = {
            user: { id: 'user-1', email: 'learner@example.com' },
            accessToken: 'token',
            tokenType: 'Bearer',
            expiresAt: '2099-01-01T00:00:00Z',
        }
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(session, { status: 201 }))
        vi.stubGlobal('fetch', fetchMock)

        await expect(authenticate('register', 'learner@example.com', 'Good-Pass1!')).resolves.toEqual(
            session,
        )
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/auth/register',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'learner@example.com', password: 'Good-Pass1!' }),
            }),
        )
    })

    it('maps API authentication errors to user-facing error codes', async () => {
        vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 })))

        await expect(authenticate('login', 'learner@example.com', 'wrong')).rejects.toMatchObject({
            code: 'authInvalidCredentials',
        } satisfies Partial<AuthApiError>)
    })
})

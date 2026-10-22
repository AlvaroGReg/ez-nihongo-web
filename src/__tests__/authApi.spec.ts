import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
    authenticate,
    AuthApiError,
    refreshAuthentication,
    revokeAuthentication,
} from '@/services/authApi'

const session = {
    user: { id: 'user-1', email: 'learner@example.com' },
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresAt: '2099-01-01T00:00:00Z',
}

describe('authentication API', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it('sends rememberMe and same-origin cookie/CSRF options for login', async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(session, { status: 200 }))
        vi.stubGlobal('fetch', fetchMock)

        await expect(authenticate('login', 'learner@example.com', 'Good-Pass1!', true)).resolves.toEqual(
            session,
        )
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/auth/login',
            expect.objectContaining({
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-EZ-Nihongo-Request': '1',
                },
                body: JSON.stringify({
                    email: 'learner@example.com',
                    password: 'Good-Pass1!',
                    rememberMe: true,
                }),
            }),
        )
    })

    it('does not send rememberMe for registration', async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(session, { status: 201 }))
        vi.stubGlobal('fetch', fetchMock)

        await authenticate('register', 'learner@example.com', 'Good-Pass1!')

        expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toEqual({
            email: 'learner@example.com',
            password: 'Good-Pass1!',
        })
    })

    it('refreshes with the HttpOnly cookie and CSRF header', async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(session))
        vi.stubGlobal('fetch', fetchMock)

        await expect(refreshAuthentication()).resolves.toEqual(session)
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/auth/refresh',
            expect.objectContaining({
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'X-EZ-Nihongo-Request': '1' },
            }),
        )
    })

    it('treats missing or invalid refresh sessions as anonymous', async () => {
        vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 })))
        await expect(refreshAuthentication()).resolves.toBeNull()
    })

    it('requests server-side logout with the HttpOnly cookie', async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
        vi.stubGlobal('fetch', fetchMock)

        await revokeAuthentication()
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/auth/logout',
            expect.objectContaining({ method: 'POST', credentials: 'include' }),
        )
    })

    it('maps API authentication errors to user-facing error codes', async () => {
        vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 })))

        await expect(authenticate('login', 'learner@example.com', 'wrong')).rejects.toMatchObject({
            code: 'authInvalidCredentials',
        } satisfies Partial<AuthApiError>)
    })
})

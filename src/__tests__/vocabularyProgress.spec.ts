import { beforeEach, describe, expect, it, vi } from 'vitest'

import { auth } from '@/stores/auth'
import {
    getVocabularyAttempts,
    recordVocabularyAttempt,
    type VocabularyAttemptPayload,
} from '@/services/vocabularyProgress'

const payload: VocabularyAttemptPayload = {
    eventId: 'event-123',
    sessionId: 'session-123',
    contentId: 'vocabulary:猫:ねこ',
    exerciseType: 'reading',
    correct: false,
}

describe('vocabulary progress API', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
        auth.signOut()
        auth.saveSession({
            user: { id: 'user-1', email: 'learner@example.com' },
            accessToken: 'access-token',
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
        })
    })

    it('records only correctness and question identity with the session token', async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
        vi.stubGlobal('fetch', fetchMock)

        await recordVocabularyAttempt(payload)

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/progress/vocabulary/attempts',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
                body: JSON.stringify(payload),
            }),
        )
        expect(fetchMock.mock.calls[0]?.[1]?.body).not.toContain('response')
    })

    it('queries the authenticated user history with pagination', async () => {
        const history = {
            total: 1,
            offset: 5,
            limit: 10,
            attempts: [{ ...payload, createdAt: '2026-10-22T10:00:00+00:00' }],
        }
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(history))
        vi.stubGlobal('fetch', fetchMock)

        await expect(getVocabularyAttempts(5, 10)).resolves.toEqual(history)

        const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
        expect(url.pathname).toBe('/api/v1/progress/vocabulary/attempts')
        expect(url.searchParams.get('offset')).toBe('5')
        expect(url.searchParams.get('limit')).toBe('10')
        expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe(
            'Bearer access-token',
        )
    })

    it('reports failed HTTP writes to the caller', async () => {
        vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 })))

        await expect(recordVocabularyAttempt(payload)).rejects.toThrow('HTTP 503')
    })
})

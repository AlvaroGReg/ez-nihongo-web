import { auth } from '@/stores/auth'

const PROGRESS_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/progress/vocabulary/attempts`

export interface VocabularyAttemptPayload {
    eventId: string
    sessionId: string
    contentId: string
    exerciseType: string
    correct: boolean
}

export interface VocabularyAttempt {
    eventId: string
    sessionId: string
    contentId: string
    exerciseType: string
    correct: boolean
    createdAt: string
}

export interface VocabularyAttemptPage {
    total: number
    offset: number
    limit: number
    attempts: VocabularyAttempt[]
}

function authorizationHeaders(): HeadersInit {
    if (!auth.state.accessToken) throw new Error('Cannot access vocabulary progress without authentication')
    return {
        Authorization: `${auth.state.tokenType ?? 'Bearer'} ${auth.state.accessToken}`,
    }
}

export async function recordVocabularyAttempt(payload: VocabularyAttemptPayload): Promise<void> {
    const response = await fetch(PROGRESS_ENDPOINT, {
        method: 'POST',
        headers: {
            ...authorizationHeaders(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(`Vocabulary progress request failed with HTTP ${response.status}`)
}

export async function getVocabularyAttempts(
    offset = 0,
    limit = 50,
): Promise<VocabularyAttemptPage> {
    const url = new URL(PROGRESS_ENDPOINT, globalThis.location?.origin ?? 'http://localhost')
    url.searchParams.set('offset', String(offset))
    url.searchParams.set('limit', String(limit))
    const response = await fetch(url, { headers: authorizationHeaders() })
    if (!response.ok) throw new Error(`Vocabulary progress request failed with HTTP ${response.status}`)

    const payload: unknown = await response.json()
    if (typeof payload !== 'object' || payload === null) throw new Error('Invalid vocabulary progress response')
    const page = payload as Record<string, unknown>
    if (
        typeof page.total !== 'number' ||
        typeof page.offset !== 'number' ||
        typeof page.limit !== 'number' ||
        !Array.isArray(page.attempts)
    ) {
        throw new Error('Invalid vocabulary progress response')
    }
    return page as unknown as VocabularyAttemptPage
}

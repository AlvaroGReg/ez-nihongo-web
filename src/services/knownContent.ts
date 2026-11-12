import { auth } from '@/stores/auth'

const KNOWN_CONTENT_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/me/known-content`
const PAGE_SIZE = 200
const MAX_ITEMS = 1000

export type KnownContentType = 'vocabulary' | 'kanji'
export type KnownContentLanguage = 'en' | 'es'

interface KnownContentBase {
    id: string
    contentType: KnownContentType
    source: 'catalog' | 'custom'
    catalogContentId: string | null
    createdAt: string
}

export interface KnownVocabularyContent {
    word: string
    reading: string
    romaji: string
    meaning: string
    level?: number
}

export interface KnownKanjiContent {
    kanji: string
    readings: string[]
    meanings: string[]
    level?: number
}

export type KnownContentItem =
    | (KnownContentBase & { contentType: 'vocabulary'; content: KnownVocabularyContent })
    | (KnownContentBase & { contentType: 'kanji'; content: KnownKanjiContent })

export interface KnownContentPage {
    total: number
    offset: number
    limit: number
    items: KnownContentItem[]
}

export interface AddCatalogKnownContentResult {
    item: KnownContentItem
    alreadyPresent: boolean
}

export interface CustomVocabularyInput {
    word: string
    reading: string
    romaji: string
    meaning: string
}

export interface CustomKanjiInput {
    kanji: string
    readings: string[]
    meanings: string[]
}

function authorizationHeaders(): HeadersInit {
    if (!auth.state.accessToken) throw new Error('Known content requires authentication')
    return { Authorization: `${auth.state.tokenType ?? 'Bearer'} ${auth.state.accessToken}` }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)
}

function isKnownContentItem(value: unknown): value is KnownContentItem {
    if (!isRecord(value)) return false
    if (
        !isNonEmptyString(value.id) ||
        !isNonEmptyString(value.createdAt) ||
        !Number.isFinite(Date.parse(value.createdAt)) ||
        (value.source !== 'catalog' && value.source !== 'custom') ||
        (value.catalogContentId !== null && !isNonEmptyString(value.catalogContentId)) ||
        (value.source === 'catalog' && value.catalogContentId === null) ||
        (value.source === 'custom' && value.catalogContentId !== null) ||
        !isRecord(value.content)
    ) return false

    const content = value.content
    if (value.contentType === 'vocabulary') {
        return (
            isNonEmptyString(content.word) &&
            isNonEmptyString(content.reading) &&
            isNonEmptyString(content.romaji) &&
            isNonEmptyString(content.meaning) &&
            (value.source === 'custom' ? content.level === undefined : Number.isInteger(content.level))
        )
    }
    if (value.contentType === 'kanji') {
        return (
            isNonEmptyString(content.kanji) &&
            isStringArray(content.readings) &&
            isStringArray(content.meanings) &&
            (value.source === 'custom' ? content.level === undefined : Number.isInteger(content.level))
        )
    }
    return false
}

function isKnownContentPage(value: unknown): value is KnownContentPage {
    if (!isRecord(value) || !Array.isArray(value.items)) return false
    return (
        Number.isInteger(value.total) &&
        Number(value.total) >= 0 &&
        Number(value.total) <= MAX_ITEMS &&
        Number.isInteger(value.offset) &&
        Number(value.offset) >= 0 &&
        Number.isInteger(value.limit) &&
        Number(value.limit) >= 1 &&
        Number(value.limit) <= PAGE_SIZE &&
        value.items.every(isKnownContentItem) &&
        value.items.length <= Number(value.limit)
    )
}

async function readJson(response: Response): Promise<unknown> {
    try {
        return await response.json() as unknown
    } catch {
        throw new Error('Invalid known content response')
    }
}

async function request<T>(path: string, init: RequestInit = {}, validate: (value: unknown) => value is T): Promise<T> {
    const response = await fetch(`${KNOWN_CONTENT_ENDPOINT}${path}`, {
        ...init,
        headers: { ...authorizationHeaders(), ...init.headers },
    })
    if (!response.ok) {
        let code: string | undefined
        let problemDetails: Record<string, unknown> | undefined
        try {
            const problem: unknown = await response.json()
            if (isRecord(problem)) {
                problemDetails = problem
                if (typeof problem.code === 'string') code = problem.code
            }
        } catch { /* Problem Details may have no JSON body. */ }
        const error = new Error(code ?? `Known content request failed with HTTP ${response.status}`) as Error & {
            code?: string
            contentType?: KnownContentType
            catalogContentId?: string
        }
        error.code = code
        if (problemDetails?.contentType === 'vocabulary' || problemDetails?.contentType === 'kanji') {
            error.contentType = problemDetails.contentType
        }
        if (typeof problemDetails?.catalogContentId === 'string') {
            error.catalogContentId = problemDetails.catalogContentId
        }
        throw error
    }
    const payload = await readJson(response)
    if (!validate(payload)) throw new Error('Invalid known content response')
    return payload
}

function isAddCatalogResult(value: unknown): value is AddCatalogKnownContentResult {
    return isRecord(value) && isKnownContentItem(value.item) && typeof value.alreadyPresent === 'boolean'
}

export async function getKnownContentPage(options: {
    type?: KnownContentType
    offset?: number
    limit?: number
    language?: KnownContentLanguage
} = {}): Promise<KnownContentPage> {
    const { offset = 0, limit = 50, language = 'en', type } = options
    const url = new URL(KNOWN_CONTENT_ENDPOINT, globalThis.location?.origin ?? 'http://localhost')
    url.searchParams.set('offset', String(offset))
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('language', language)
    if (type) url.searchParams.set('type', type)
    return request(url.search, {}, isKnownContentPage)
}

export async function getAllKnownContent(options: {
    type?: KnownContentType
    language?: KnownContentLanguage
} = {}): Promise<KnownContentItem[]> {
    const items: KnownContentItem[] = []
    let offset = 0
    let total: number | undefined
    do {
        const page = await getKnownContentPage({ ...options, offset, limit: PAGE_SIZE })
        if (page.offset !== offset || (total !== undefined && page.total !== total)) {
            throw new Error('Inconsistent known content pagination response')
        }
        total = page.total
        if (page.items.length === 0 && offset < total) throw new Error('Incomplete known content pagination response')
        items.push(...page.items)
        offset += page.items.length
        if (items.length > MAX_ITEMS) throw new Error('Known content exceeds the supported maximum')
    } while (offset < (total ?? 0))
    return items
}

export function addCatalogKnownContent(
    contentType: KnownContentType,
    catalogContentId: string,
    language: KnownContentLanguage = 'en',
): Promise<AddCatalogKnownContentResult> {
    const url = new URL(`${KNOWN_CONTENT_ENDPOINT}/catalog`, globalThis.location?.origin ?? 'http://localhost')
    url.searchParams.set('language', language)
    return request(`/catalog${url.search}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, catalogContentId }),
    }, isAddCatalogResult)
}

export function createCustomVocabulary(input: CustomVocabularyInput): Promise<KnownContentItem> {
    return request('/custom/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    }, isKnownContentItem)
}

export function createCustomKanji(input: CustomKanjiInput): Promise<KnownContentItem> {
    return request('/custom/kanji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    }, isKnownContentItem)
}

export async function removeKnownContent(id: string): Promise<void> {
    const response = await fetch(`${KNOWN_CONTENT_ENDPOINT}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: authorizationHeaders(),
    })
    if (!response.ok) throw new Error(`Known content request failed with HTTP ${response.status}`)
}

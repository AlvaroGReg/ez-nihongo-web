import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
    addCatalogKnownContent,
    createCustomKanji,
    createCustomVocabulary,
    getAllKnownContent,
    getKnownContentPage,
    removeKnownContent,
} from '@/services/knownContent'
import { auth } from '@/stores/auth'
import { knownContent } from '@/stores/knownContent'

const vocabularyItem = {
    id: 'item-1',
    contentType: 'vocabulary',
    source: 'catalog',
    catalogContentId: 'vocabulary:猫:ねこ',
    createdAt: '2026-10-30T10:00:00Z',
    content: { word: '猫', reading: 'ねこ', romaji: 'neko', meaning: 'cat', level: 5 },
}

const customKanjiItem = {
    id: 'item-2',
    contentType: 'kanji',
    source: 'custom',
    catalogContentId: null,
    createdAt: '2026-10-30T10:00:00Z',
    content: { kanji: '𠀀', readings: ['あ'], meanings: ['custom'] },
}

describe('known content API', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
        knownContent.clear()
        auth.signOut()
        auth.saveSession({
            user: { id: 'user-1', email: 'learner@example.com' },
            accessToken: 'access-token',
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
        })
    })

    it('requests paginated content with bearer auth and validates the response', async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
            total: 1, offset: 0, limit: 50, items: [vocabularyItem],
        }))
        vi.stubGlobal('fetch', fetchMock)

        await expect(getKnownContentPage({ type: 'vocabulary', language: 'es' })).resolves.toMatchObject({
            total: 1,
            items: [vocabularyItem],
        })
        const url = new URL(String(fetchMock.mock.calls[0]?.[0]), 'http://localhost')
        expect(url.pathname).toBe('/api/v1/me/known-content')
        expect(url.searchParams.get('type')).toBe('vocabulary')
        expect(url.searchParams.get('language')).toBe('es')
        expect(url.searchParams.get('limit')).toBe('50')
        expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe('Bearer access-token')
    })

    it('loads every page up to the reported total', async () => {
        const fetchMock = vi.fn<typeof fetch>()
            .mockResolvedValueOnce(Response.json({ total: 201, offset: 0, limit: 200, items: Array.from({ length: 200 }, (_, i) => ({ ...vocabularyItem, id: `item-${i}` })) }))
            .mockResolvedValueOnce(Response.json({ total: 201, offset: 200, limit: 200, items: [{ ...vocabularyItem, id: 'item-200' }] }))
        vi.stubGlobal('fetch', fetchMock)

        await expect(getAllKnownContent()).resolves.toHaveLength(201)
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(new URL(String(fetchMock.mock.calls[1]?.[0]), 'http://localhost').searchParams.get('offset')).toBe('200')
    })

    it('sends catalog and custom payloads and accepts expected statuses', async () => {
        const fetchMock = vi.fn<typeof fetch>()
            .mockResolvedValueOnce(Response.json({ item: vocabularyItem, alreadyPresent: true }))
            .mockResolvedValueOnce(Response.json(customKanjiItem, { status: 201 }))
            .mockResolvedValueOnce(Response.json({ ...customKanjiItem, contentType: 'vocabulary', content: { word: '猫', reading: 'ねこ', romaji: 'neko', meaning: 'cat' } }, { status: 201 }))
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
        vi.stubGlobal('fetch', fetchMock)

        await expect(addCatalogKnownContent('vocabulary', 'vocabulary:猫:ねこ', 'es')).resolves.toMatchObject({ alreadyPresent: true })
        await expect(createCustomKanji({ kanji: '𠀀', readings: ['あ'], meanings: ['custom'] })).resolves.toMatchObject({ id: 'item-2' })
        await expect(createCustomVocabulary({ word: '猫', reading: 'ねこ', romaji: 'neko', meaning: 'cat' })).resolves.toMatchObject({ contentType: 'vocabulary' })
        await expect(removeKnownContent('item/1')).resolves.toBeUndefined()

        const catalogUrl = new URL(String(fetchMock.mock.calls[0]?.[0]), 'http://localhost')
        expect(catalogUrl.pathname).toBe('/api/v1/me/known-content/catalog')
        expect(catalogUrl.searchParams.get('language')).toBe('es')
        expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ contentType: 'vocabulary', catalogContentId: 'vocabulary:猫:ねこ' }))
        expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(JSON.stringify({ kanji: '𠀀', readings: ['あ'], meanings: ['custom'] }))
        expect(String(fetchMock.mock.calls[3]?.[0])).toContain('item%2F1')
    })

    it('rejects unauthenticated access, failed HTTP requests, and malformed DTOs', async () => {
        await auth.signOut()
        await expect(getKnownContentPage()).rejects.toThrow('requires authentication')

        auth.saveSession({ user: { id: 'user-1', email: 'learner@example.com' }, accessToken: 'access-token', tokenType: 'Bearer', expiresAt: new Date(Date.now() + 60_000).toISOString() })
        vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 409 })))
        await expect(getKnownContentPage()).rejects.toThrow('HTTP 409')

        vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json({
            code: 'catalog-duplicate', contentType: 'kanji', catalogContentId: 'kanji:学',
        }, { status: 409 })))
        await expect(createCustomKanji({ kanji: '学', readings: ['がく'], meanings: ['study'] }))
            .rejects.toMatchObject({ code: 'catalog-duplicate', contentType: 'kanji', catalogContentId: 'kanji:学' })

        vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json({ total: 1, offset: 0, limit: 50, items: [{ ...vocabularyItem, content: { ...vocabularyItem.content, level: 'N5' } }] })))
        await expect(getKnownContentPage()).rejects.toThrow('Invalid known content response')
    })

    it('clears state on logout and updates/invalidate state after mutations', async () => {
        const fetchMock = vi.fn<typeof fetch>()
            .mockResolvedValueOnce(Response.json({ total: 1, offset: 0, limit: 200, items: [vocabularyItem] }))
            .mockResolvedValueOnce(Response.json({ item: vocabularyItem, alreadyPresent: false }))
            .mockResolvedValueOnce(Response.json({ total: 1, offset: 0, limit: 200, items: [vocabularyItem] }))
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
        vi.stubGlobal('fetch', fetchMock)

        await knownContent.load()
        expect(knownContent.items.value).toHaveLength(1)
        await knownContent.addCatalog('vocabulary', 'vocabulary:猫:ねこ')
        expect(fetchMock).toHaveBeenCalledTimes(3)
        await knownContent.remove('item-1')
        expect(knownContent.items.value).toEqual([])
        await auth.signOut()
        expect(knownContent.items.value).toEqual([])
    })
})

import { readonly, ref, watch } from 'vue'

import {
    addCatalogKnownContent,
    createCustomKanji,
    createCustomVocabulary,
    getAllKnownContent,
    removeKnownContent,
} from '@/services/knownContent'
import type {
    CustomKanjiInput,
    CustomVocabularyInput,
    KnownContentItem,
    KnownContentLanguage,
    KnownContentType,
} from '@/services/knownContent'
import { auth } from '@/stores/auth'

const items = ref<KnownContentItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let loadedKey: string | null = null
let pendingLoad: Promise<KnownContentItem[]> | null = null

function clear(): void {
    items.value = []
    error.value = null
    loadedKey = null
    pendingLoad = null
}

watch(() => auth.state.accessToken, (token, previousToken) => {
    if (!token || (previousToken && token !== previousToken)) clear()
}, { flush: 'sync' })

async function load(options: { type?: KnownContentType; language?: KnownContentLanguage } = {}): Promise<KnownContentItem[]> {
    const token = auth.state.accessToken
    if (!token) throw new Error('Known content requires authentication')
    const key = `${token}:${options.type ?? 'all'}:${options.language ?? 'en'}`
    if (loadedKey === key) return items.value
    if (pendingLoad) return pendingLoad

    loading.value = true
    error.value = null
    pendingLoad = getAllKnownContent(options)
        .then((result) => {
            if (auth.state.accessToken === token) {
                items.value = result
                loadedKey = key
            }
            return result
        })
        .catch((cause: unknown) => {
            error.value = cause instanceof Error ? cause.message : 'Known content request failed'
            throw cause
        })
        .finally(() => {
            loading.value = false
            pendingLoad = null
        })
    return pendingLoad
}

async function refresh(options: { type?: KnownContentType; language?: KnownContentLanguage } = {}): Promise<KnownContentItem[]> {
    loadedKey = null
    return load(options)
}

async function addCatalog(type: KnownContentType, catalogContentId: string, language: KnownContentLanguage = 'en') {
    const result = await addCatalogKnownContent(type, catalogContentId, language)
    loadedKey = null
    await refresh({ language })
    return result
}

async function addVocabulary(input: CustomVocabularyInput, language: KnownContentLanguage = 'en'): Promise<KnownContentItem> {
    const result = await createCustomVocabulary(input)
    loadedKey = null
    await refresh({ language })
    return result
}

async function addKanji(input: CustomKanjiInput, language: KnownContentLanguage = 'en'): Promise<KnownContentItem> {
    const result = await createCustomKanji(input)
    loadedKey = null
    await refresh({ language })
    return result
}

async function remove(id: string): Promise<void> {
    await removeKnownContent(id)
    items.value = items.value.filter((item) => item.id !== id)
    loadedKey = null
}

export const knownContent = {
    items: readonly(items),
    loading: readonly(loading),
    error: readonly(error),
    load,
    refresh,
    addCatalog,
    addVocabulary,
    addKanji,
    remove,
    clear,
}

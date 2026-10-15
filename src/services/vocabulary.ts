import { createVocabularyContentId } from '@/services/content'
import { auth } from '@/stores/auth'
import type { ContentProvider } from '@/services/contentProvider'
import type { JlptLevel, Locale, TestConfig, VocabularyWord } from '@/types/domain'

interface CatalogEntry {
    contentId?: string
    word: string
    meaning: Record<Locale, string>
    furigana: string
    romaji: string
    level: JlptLevel
}

let catalogPromise: Promise<CatalogEntry[]> | undefined
const WORDS_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/vocabulary`

export class VocabularyContentError extends Error {
    constructor(
        public readonly code:
            | 'providerCatalogError'
            | 'providerResponseError'
            | 'providerInsufficientError',
    ) {
        super(code)
        this.name = 'VocabularyContentError'
    }
}

async function loadCatalog(): Promise<CatalogEntry[]> {
    catalogPromise ??= fetch(`${import.meta.env.BASE_URL}data/jlpt-vocabulary.json`)
        .then((response) => {
            if (!response.ok) throw new VocabularyContentError('providerCatalogError')
            return response.json() as Promise<unknown>
        })
        .then((value) => {
            if (!Array.isArray(value)) throw new VocabularyContentError('providerCatalogError')
            return value as CatalogEntry[]
        })
        .catch((error: unknown) => {
            catalogPromise = undefined
            if (error instanceof VocabularyContentError) throw error
            throw new VocabularyContentError('providerCatalogError')
        })

    return catalogPromise
}

async function loadApiCatalog(locale: Locale, config: TestConfig): Promise<CatalogEntry[]> {
    const entries: CatalogEntry[] = []
    const levelsToLoad = [...new Set(config.levels)]

    const loadLevel = async (level: JlptLevel, limit: number): Promise<void> => {
        let offset = 0
        let total = 0

        do {
            const url = new URL(WORDS_ENDPOINT, globalThis.location?.origin ?? 'http://localhost')
            url.searchParams.set('level', String(level))
            url.searchParams.set('offset', String(offset))
            url.searchParams.set('limit', String(Math.min(limit, 200)))
            url.searchParams.set('language', locale)

            let response: Response
            try {
                response = await fetch(url, {
                    headers: {
                        Authorization: `${auth.state.tokenType ?? 'Bearer'} ${auth.state.accessToken}`,
                    },
                })
            } catch {
                throw new VocabularyContentError('providerCatalogError')
            }

            if (!response.ok) throw new VocabularyContentError('providerCatalogError')

            try {
                const value: unknown = await response.json()
                if (typeof value !== 'object' || value === null) {
                    throw new VocabularyContentError('providerResponseError')
                }

                const page = value as Record<string, unknown>
                if (
                    typeof page.total !== 'number' ||
                    typeof page.offset !== 'number' ||
                    !Array.isArray(page.words)
                ) {
                    throw new VocabularyContentError('providerResponseError')
                }

                total = page.total
                for (const item of page.words) {
                    if (typeof item !== 'object' || item === null) {
                        throw new VocabularyContentError('providerResponseError')
                    }
                    const word = item as Record<string, unknown>
                    if (
                        typeof word.contentId !== 'string' ||
                        typeof word.word !== 'string' ||
                        typeof word.meaning !== 'string' ||
                        typeof word.furigana !== 'string' ||
                        typeof word.romaji !== 'string' ||
                        typeof word.level !== 'number' ||
                        !isJlptLevel(word.level)
                    ) {
                        throw new VocabularyContentError('providerResponseError')
                    }

                    entries.push({
                        contentId: word.contentId,
                        word: word.word,
                        meaning: { en: word.meaning, es: word.meaning },
                        furigana: word.furigana,
                        romaji: word.romaji,
                        level: word.level,
                    })
                }

                const nextOffset = page.offset + page.words.length
                if (page.words.length === 0 || nextOffset <= offset) break
                offset = nextOffset
            } catch (error) {
                if (error instanceof VocabularyContentError) throw error
                throw new VocabularyContentError('providerResponseError')
            }
        } while (offset < total && entries.filter((entry) => entry.level === level).length < limit)
    }

    for (const level of levelsToLoad) {
        await loadLevel(level, config.questionCount)
    }

    let remaining = config.questionCount - entries.length
    const fallbackCandidates = levelsToLoad.flatMap((level) =>
        fallbackLevels(level).filter((candidate) => !levelsToLoad.includes(candidate)),
    )
    for (const level of [...new Set(fallbackCandidates)]) {
        if (remaining <= 0) break
        await loadLevel(level, remaining)
        remaining = config.questionCount - entries.length
    }

    return entries
}

function isJlptLevel(value: number): value is JlptLevel {
    return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
}

function fallbackLevels(selectedLevel: JlptLevel): JlptLevel[] {
    const levels: JlptLevel[] = [selectedLevel]
    for (let distance = 1; distance <= 4; distance += 1) {
        const easier = selectedLevel + distance
        const harder = selectedLevel - distance
        if (isJlptLevel(easier)) levels.push(easier)
        if (isJlptLevel(harder)) levels.push(harder)
    }
    return levels
}

function questionKey(word: CatalogEntry): string {
    return `${word.word}\u0000${word.furigana}`
}

function shuffle<T>(values: T[]): T[] {
    const shuffled = [...values]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const otherIndex = Math.floor(Math.random() * (index + 1))
        ;[shuffled[index]!, shuffled[otherIndex]!] = [shuffled[otherIndex]!, shuffled[index]!]
    }
    return shuffled
}

export async function loadQuestions(
    config: TestConfig,
    locale: Locale = 'en',
): Promise<{ questions: VocabularyWord[]; levelsUsed: JlptLevel[] }> {
    const selectedLevels = [...new Set(config.levels)]
    if (selectedLevels.length === 0 || config.questionCount <= 0) {
        throw new VocabularyContentError('providerResponseError')
    }

    // Authenticated learners always use the platform source. Do not fall back to
    // the bundled copy on API errors, or their practice would bypass tracking.
    const catalog = auth.state.accessToken
        ? await loadApiCatalog(locale, config)
        : await loadCatalog()
    const wordsByLevel = new Map<JlptLevel, CatalogEntry[]>()
    for (const word of catalog) {
        const entries = wordsByLevel.get(word.level) ?? []
        entries.push(word)
        wordsByLevel.set(word.level, entries)
    }

    const seen = new Set<string>()
    const questions: VocabularyWord[] = []
    const levelsUsed: JlptLevel[] = []

    const addWords = (level: JlptLevel, needed: number): void => {
        if (needed === 0) return

        const startCount = questions.length
        let addedFromLevel = false
        for (const word of wordsByLevel.get(level) ?? []) {
            const key = questionKey(word)
            if (seen.has(key)) continue

            seen.add(key)
            questions.push({
                contentId: word.contentId ?? createVocabularyContentId(word.word, word.furigana),
                word: word.word,
                meaning: word.meaning[locale] ?? word.meaning.en,
                furigana: word.furigana,
                romaji: word.romaji,
                level: word.level,
            })
            addedFromLevel = true
            if (questions.length - startCount >= needed) break
        }

        if (addedFromLevel && !levelsUsed.includes(level)) levelsUsed.push(level)
    }

    const basePerLevel = Math.floor(config.questionCount / selectedLevels.length)
    let extraQuestions = config.questionCount % selectedLevels.length
    for (const level of selectedLevels) {
        const target = basePerLevel + (extraQuestions > 0 ? 1 : 0)
        extraQuestions -= 1
        addWords(level, target)
    }

    if (selectedLevels.length > 1) {
        for (const level of selectedLevels) {
            const remaining = config.questionCount - questions.length
            if (remaining === 0) break
            addWords(level, remaining)
        }
    }

    const fallbackCandidates = selectedLevels.flatMap((level) =>
        fallbackLevels(level).filter((candidate) => !selectedLevels.includes(candidate)),
    )
    for (const level of [...new Set(fallbackCandidates)]) {
        const remaining = config.questionCount - questions.length
        if (remaining === 0) break
        addWords(level, remaining)
    }

    if (questions.length < config.questionCount) {
        throw new VocabularyContentError('providerInsufficientError')
    }

    return { questions: shuffle(questions), levelsUsed }
}

export function getFallbackLevelsForTest(level: JlptLevel): JlptLevel[] {
    return fallbackLevels(level)
}

export const localVocabularyProvider: ContentProvider = { loadQuestions }

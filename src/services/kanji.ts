import type { JlptLevel, Locale, TestConfig, VocabularyWord } from '@/types/domain'

const OPTION_COUNT = 4
const READING_PATTERN = /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u
const catalogPromises = new Map<JlptLevel, Promise<KanjiCatalogFile>>()

export interface KanjiRecord {
    grade: number
    heisig_en: string | null
    jlpt: JlptLevel
    kanji: string
    kun_readings: string[]
    meanings_en: string[]
    meanings_es?: string[]
    name_readings: string[]
    on_readings: string[]
    unicode: string
    id: string
}

interface KanjiCatalogFile {
    kanjis: Record<string, KanjiRecord>
}

export class KanjiContentError extends Error {
    constructor(
        public readonly code:
            'providerCatalogError' | 'providerResponseError' | 'providerInsufficientError',
    ) {
        super(code)
        this.name = 'KanjiContentError'
    }
}

function shuffle<T>(values: T[]): T[] {
    const shuffled = [...values]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const other = Math.floor(Math.random() * (index + 1))
        ;[shuffled[index]!, shuffled[other]!] = [shuffled[other]!, shuffled[index]!]
    }
    return shuffled
}

function normalizedAnswer(value: string): string {
    return value.trim().normalize('NFC').toLocaleLowerCase()
}

function randomItem(values: string[]): string {
    return values[Math.floor(Math.random() * values.length)]!
}

function normalizeReading(reading: string): string {
    return reading.replace(/[.-]/g, '').trim()
}

async function loadKanjiLevel(level: JlptLevel): Promise<KanjiCatalogFile> {
    let catalogPromise = catalogPromises.get(level)
    if (!catalogPromise) {
        catalogPromise = fetch(`${import.meta.env.BASE_URL}data/jlpt-kanji/n${level}.json`)
            .then((response) => {
                if (!response.ok) throw new KanjiContentError('providerCatalogError')
                return response.json() as Promise<unknown>
            })
            .then((value) => {
                if (typeof value !== 'object' || value === null || !('kanjis' in value)) {
                    throw new KanjiContentError('providerResponseError')
                }
                const kanjis = value.kanjis
                if (typeof kanjis !== 'object' || kanjis === null || Array.isArray(kanjis)) {
                    throw new KanjiContentError('providerResponseError')
                }
                return value as KanjiCatalogFile
            })
            .catch((error: unknown) => {
                catalogPromises.delete(level)
                if (error instanceof KanjiContentError) throw error
                throw new KanjiContentError('providerCatalogError')
            })
        catalogPromises.set(level, catalogPromise)
    }
    return catalogPromise
}

function toQuestion(record: KanjiRecord, level: JlptLevel, locale: Locale): VocabularyWord | null {
    const kanjiReadings = [
        ...new Set(
            [...record.kun_readings, ...record.on_readings]
                .map(normalizeReading)
                .filter((reading) => READING_PATTERN.test(reading)),
        ),
    ]
    const kanjiMeanings = [
        ...new Set(
            locale === 'es' && level >= 4 && record.meanings_es?.length
                ? record.meanings_es
                : record.meanings_en,
        ),
    ].filter((meaning) => meaning.trim() !== '')

    if (kanjiReadings.length === 0 || kanjiMeanings.length === 0) return null

    return {
        contentId: `kanji:${record.id}`,
        word: record.kanji,
        meaning: randomItem(kanjiMeanings),
        furigana: randomItem(kanjiReadings),
        romaji: '',
        level,
        kanjiReadings,
        kanjiMeanings,
    }
}

export async function loadKanjiQuestions(
    config: TestConfig,
    locale: Locale,
): Promise<{
    questions: VocabularyWord[]
    levelsUsed: JlptLevel[]
    distractorPool: VocabularyWord[]
}> {
    if (
        config.levels.length === 0 ||
        config.levels.some((level) => ![1, 2, 3, 4, 5].includes(level)) ||
        config.questionCount < 1
    ) {
        throw new KanjiContentError('providerResponseError')
    }

    const catalogs = await Promise.all(config.levels.map((level) => loadKanjiLevel(level)))
    const candidates = shuffle(
        catalogs.flatMap((catalog, index) => {
            const level = config.levels[index]!
            return Object.values(catalog.kanjis)
                .map((record) => toQuestion(record, level, locale))
                .filter((question): question is VocabularyWord => question !== null)
        }),
    )
    const seen = new Set<string>()
    const uniqueCandidates = candidates.filter((question) => {
        if (seen.has(question.contentId!)) return false
        seen.add(question.contentId!)
        return true
    })
    const questions = uniqueCandidates.slice(0, config.questionCount)

    if (questions.length < config.questionCount) {
        throw new KanjiContentError('providerInsufficientError')
    }

    return {
        questions,
        levelsUsed: [...new Set(questions.map((question) => question.level))],
        distractorPool: uniqueCandidates,
    }
}

export function createKanjiAnswerOptions(
    question: VocabularyWord,
    pool: VocabularyWord[],
    exerciseType: 'reading' | 'meaning',
    previousWrongAnswers: string[] = [],
    additionalCandidates: string[] = [],
): string[] {
    const correctAnswer = exerciseType === 'reading' ? question.furigana : question.meaning
    const validAnswerVariants =
        exerciseType === 'reading' ? question.kanjiReadings : question.kanjiMeanings
    const validAnswers = new Set((validAnswerVariants ?? []).map(normalizedAnswer))
    validAnswers.add(normalizedAnswer(correctAnswer))
    const values = new Map<string, string>()

    for (const candidate of pool) {
        const value = (exerciseType === 'reading' ? candidate.furigana : candidate.meaning).trim()
        const key = normalizedAnswer(value)
        if (key !== '' && !validAnswers.has(key) && !values.has(key)) values.set(key, value)
    }
    for (const value of additionalCandidates) {
        const key = normalizedAnswer(value)
        if (key !== '' && !validAnswers.has(key) && !values.has(key)) values.set(key, value.trim())
    }

    const prioritized = shuffle(
        [...new Set(previousWrongAnswers.map(normalizedAnswer))]
            .filter((value) => values.has(value))
            .map((value) => values.get(value)!),
    )
    const prioritizedKeys = new Set(prioritized.map(normalizedAnswer))
    const randomCandidates = shuffle(
        [...values.values()].filter((value) => !prioritizedKeys.has(normalizedAnswer(value))),
    )
    const distractors = [...prioritized, ...randomCandidates].slice(0, OPTION_COUNT - 1)

    if (distractors.length !== OPTION_COUNT - 1) {
        throw new KanjiContentError('providerInsufficientError')
    }

    return shuffle([correctAnswer, ...distractors])
}

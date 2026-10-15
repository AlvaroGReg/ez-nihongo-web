import { createVocabularyContentId } from '@/services/content'
import { loadLocalCatalog } from '@/services/vocabulary'
import type { JlptLevel, Locale, TestConfig, VocabularyWord } from '@/types/domain'

const KANJI_PATTERN = /\p{Script=Han}/u
const OPTION_COUNT = 4

export class KanjiContentError extends Error {
    constructor(public readonly code: 'providerResponseError' | 'providerInsufficientError') {
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

function answerFor(question: VocabularyWord, exerciseType: 'reading' | 'meaning'): string {
    return exerciseType === 'reading' ? question.furigana : question.meaning
}

function normalizedAnswer(value: string): string {
    return value.trim().normalize('NFC').toLocaleLowerCase()
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
        config.levels.some((level) => level !== 4 && level !== 5) ||
        config.questionCount < 1
    ) {
        throw new KanjiContentError('providerResponseError')
    }

    const selectedLevels = new Set(config.levels)
    const catalog = await loadLocalCatalog()
    const candidates = shuffle(
        catalog
            .filter(
                (entry) =>
                    selectedLevels.has(entry.level) &&
                    KANJI_PATTERN.test(entry.word) &&
                    entry.furigana.trim() !== '' &&
                    (entry.meaning[locale] ?? entry.meaning.en).trim() !== '',
            )
            .map((entry) => ({
                contentId: entry.contentId ?? createVocabularyContentId(entry.word, entry.furigana),
                word: entry.word,
                meaning: entry.meaning[locale] ?? entry.meaning.en,
                furigana: entry.furigana,
                romaji: entry.romaji,
                level: entry.level,
            })),
    )

    const seen = new Set<string>()
    const questions = candidates
        .filter((entry) => {
            const key = `${entry.word}\u0000${entry.furigana}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
        .slice(0, config.questionCount)

    if (questions.length < config.questionCount) {
        throw new KanjiContentError('providerInsufficientError')
    }

    return {
        questions,
        levelsUsed: [...new Set(questions.map((question) => question.level))],
        distractorPool: candidates,
    }
}

export function createKanjiAnswerOptions(
    question: VocabularyWord,
    pool: VocabularyWord[],
    exerciseType: 'reading' | 'meaning',
    previousWrongAnswers: string[] = [],
    additionalCandidates: string[] = [],
): string[] {
    const correctAnswer = answerFor(question, exerciseType)
    const correctKey = normalizedAnswer(correctAnswer)
    const values = new Map<string, string>()

    for (const candidate of pool) {
        const value = answerFor(candidate, exerciseType).trim()
        const key = normalizedAnswer(value)
        if (key !== '' && key !== correctKey && !values.has(key)) values.set(key, value)
    }
    for (const value of additionalCandidates) {
        const key = normalizedAnswer(value)
        if (key !== '' && key !== correctKey && !values.has(key)) values.set(key, value.trim())
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

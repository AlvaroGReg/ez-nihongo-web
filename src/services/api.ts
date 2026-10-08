import n1 from '../../data-source/db/n1.json'
import n2 from '../../data-source/db/n2.json'
import n3 from '../../data-source/db/n3.json'
import n4 from '../../data-source/db/n4.json'
import n5 from '../../data-source/db/n5.json'
import { createVocabularyContentId } from '@/services/content'
import type { JlptLevel, TestConfig, VocabularyWord } from '@/types/domain'
import type { ContentProvider } from '@/services/contentProvider'

interface SourceWord {
    word: string
    meaning: { en?: string; es?: string }
    furigana: string
    romaji: string
    level: JlptLevel
    uuid?: string
}

const wordsByLevel: Record<JlptLevel, SourceWord[]> = {
    1: n1 as SourceWord[],
    2: n2 as SourceWord[],
    3: n3 as SourceWord[],
    4: n4 as SourceWord[],
    5: n5 as SourceWord[],
}

export class VocabularyApiError extends Error {
    constructor(
        public readonly code: VocabularyApiErrorCode,
        message?: string,
    ) {
        super(message ?? code)
        this.name = 'VocabularyApiError'
    }
}

export type VocabularyApiErrorCode = 'providerResponseError' | 'providerInsufficientError'

function toVocabularyWord(source: SourceWord): VocabularyWord {
    return {
        contentId: source.uuid ?? createVocabularyContentId(source.word, source.furigana),
        word: source.word,
        meaning: source.meaning.en || source.meaning.es || '',
        furigana: source.furigana,
        romaji: source.romaji,
        level: source.level,
    }
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

function isJlptLevel(value: number): value is JlptLevel {
    return value >= 1 && value <= 5
}

function questionKey(word: VocabularyWord): string {
    return `${word.word}\u0000${word.furigana}`
}

function shuffle<T>(values: T[]): T[] {
    const shuffled = [...values]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const other = Math.floor(Math.random() * (index + 1))
        ;[shuffled[index]!, shuffled[other]!] = [shuffled[other]!, shuffled[index]!]
    }
    return shuffled
}

export async function loadQuestions(config: TestConfig): Promise<{
    questions: VocabularyWord[]
    levelsUsed: JlptLevel[]
}> {
    const selectedLevels = [...new Set(config.levels)]
    if (selectedLevels.length === 0 || config.questionCount <= 0) {
        throw new VocabularyApiError('providerResponseError')
    }

    const seen = new Set<string>()
    const questions: VocabularyWord[] = []
    const levelsUsed: JlptLevel[] = []
    const addWords = (level: JlptLevel, needed: number): void => {
        if (needed <= 0) return
        const available = wordsByLevel[level]
            .map(toVocabularyWord)
            .filter((word) => word.word.trim() !== '' && word.meaning.trim() !== '' && word.romaji.trim() !== '')
            .filter((word) => !seen.has(questionKey(word)))
        const chosen = shuffle(available).slice(0, needed)
        chosen.forEach((word) => seen.add(questionKey(word)))
        if (chosen.length > 0 && !levelsUsed.includes(level)) levelsUsed.push(level)
        questions.push(...chosen)
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
            addWords(level, config.questionCount - questions.length)
        }
    }

    const fallbackCandidates = selectedLevels.flatMap((level) =>
        fallbackLevels(level).filter((candidate) => !selectedLevels.includes(candidate)),
    )
    for (const level of [...new Set(fallbackCandidates)]) {
        addWords(level, config.questionCount - questions.length)
    }

    if (questions.length < config.questionCount) {
        throw new VocabularyApiError('providerInsufficientError')
    }

    return { questions: shuffle(questions), levelsUsed }
}

export function getFallbackLevelsForTest(level: JlptLevel): JlptLevel[] {
    return fallbackLevels(level)
}

export const vocabularyApiProvider: ContentProvider = { loadQuestions }

import type { JlptLevel, Locale, TestConfig, VocabularyWord } from '@/types/domain'

export interface LoadedQuestions {
    questions: VocabularyWord[]
    levelsUsed: JlptLevel[]
}

export interface ContentProvider {
    loadQuestions(config: TestConfig, locale?: Locale): Promise<LoadedQuestions>
}

export type LoadQuestions = (config: TestConfig, locale?: Locale) => Promise<LoadedQuestions>

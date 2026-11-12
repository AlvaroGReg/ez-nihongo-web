const SEARCH_PUNCTUATION = /[\s.,。、，・･\-‐‑‒–—―]/gu

export interface SearchTextSegment {
    text: string
    matched: boolean
}

export function normalizeSearchText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/(\p{Script=Latin})(\p{M}+)/gu, (_match: string, letter: string, marks: string) =>
            letter.toLocaleLowerCase() === 'n' && marks.includes('\u0303')
                ? `${letter}${marks}`
                : letter,
        )
        .normalize('NFC')
        .toLocaleLowerCase()
        .replace(SEARCH_PUNCTUATION, '')
}

export function splitSearchMatches(value: string, query: string): SearchTextSegment[] {
    const sourceCharacters = [...value]
    const normalizedCharacters: string[] = []
    const sourceIndexes: number[] = []

    sourceCharacters.forEach((character, sourceIndex) => {
        for (const normalizedCharacter of normalizeSearchText(character)) {
            normalizedCharacters.push(normalizedCharacter)
            sourceIndexes.push(sourceIndex)
        }
    })

    const normalizedQuery = [...normalizeSearchText(query)]
    if (normalizedQuery.length === 0) return [{ text: value, matched: false }]

    const matches: Array<{ start: number; end: number }> = []
    for (let index = 0; index <= normalizedCharacters.length - normalizedQuery.length; index += 1) {
        if (
            !normalizedQuery.every(
                (character, offset) => normalizedCharacters[index + offset] === character,
            )
        ) {
            continue
        }

        const start = sourceIndexes[index]!
        const end = sourceIndexes[index + normalizedQuery.length - 1]! + 1
        const previous = matches[matches.length - 1]
        if (previous && start <= previous.end) previous.end = Math.max(previous.end, end)
        else matches.push({ start, end })
        index += normalizedQuery.length - 1
    }

    if (matches.length === 0) return [{ text: value, matched: false }]

    const segments: SearchTextSegment[] = []
    let sourceIndex = 0
    for (const match of matches) {
        if (match.start > sourceIndex) {
            segments.push({
                text: sourceCharacters.slice(sourceIndex, match.start).join(''),
                matched: false,
            })
        }
        segments.push({
            text: sourceCharacters.slice(match.start, match.end).join(''),
            matched: true,
        })
        sourceIndex = match.end
    }
    if (sourceIndex < sourceCharacters.length) {
        segments.push({ text: sourceCharacters.slice(sourceIndex).join(''), matched: false })
    }

    return segments
}

export function includesSearchText(fields: string[], query: string): boolean {
    const normalizedQuery = normalizeSearchText(query)
    if (!normalizedQuery) return true

    return fields.some((field) => normalizeSearchText(field).includes(normalizedQuery))
}

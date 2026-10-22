const SEARCH_PUNCTUATION = /[\s.,。、，・･\-‐‑‒–—―]/gu

export function normalizeSearchText(value: string): string {
    return value.normalize('NFC').toLocaleLowerCase().replace(SEARCH_PUNCTUATION, '')
}

export function includesSearchText(fields: string[], query: string): boolean {
    const normalizedQuery = normalizeSearchText(query)
    if (!normalizedQuery) return true

    return fields.some((field) => normalizeSearchText(field).includes(normalizedQuery))
}

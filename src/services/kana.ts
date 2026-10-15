import type { KanaDirection, KanaRow, KanaScript, KanaType, VocabularyWord } from '@/types/domain'

export interface KanaEntry {
    hiragana: string
    katakana: string
    romaji: string
    row: KanaRow
    type: KanaType
}

const rows: Array<{ id: KanaRow; type: KanaType; hiragana: string; katakana: string }> = [
    { id: 'a', type: 'gojuon', hiragana: 'あいうえお', katakana: 'アイウエオ' },
    { id: 'ka', type: 'gojuon', hiragana: 'かきくけこ', katakana: 'カキクケコ' },
    { id: 'sa', type: 'gojuon', hiragana: 'さしすせそ', katakana: 'サシスセソ' },
    { id: 'ta', type: 'gojuon', hiragana: 'たちつてと', katakana: 'タチツテト' },
    { id: 'na', type: 'gojuon', hiragana: 'なにぬねの', katakana: 'ナニヌネノ' },
    { id: 'ha', type: 'gojuon', hiragana: 'はひふへほ', katakana: 'ハヒフヘホ' },
    { id: 'ma', type: 'gojuon', hiragana: 'まみむめも', katakana: 'マミムメモ' },
    { id: 'ya', type: 'gojuon', hiragana: 'や ゆ よ', katakana: 'ヤ ユ ヨ' },
    { id: 'ra', type: 'gojuon', hiragana: 'らりるれろ', katakana: 'ラリルレロ' },
    { id: 'wa', type: 'gojuon', hiragana: 'わ を', katakana: 'ワ ヲ' },
    { id: 'n', type: 'gojuon', hiragana: 'ん', katakana: 'ン' },
    { id: 'ga', type: 'dakuon', hiragana: 'がぎぐげご', katakana: 'ガギグゲゴ' },
    { id: 'za', type: 'dakuon', hiragana: 'ざじずぜぞ', katakana: 'ザジズゼゾ' },
    { id: 'da', type: 'dakuon', hiragana: 'だぢづでど', katakana: 'ダヂヅデド' },
    { id: 'ba', type: 'dakuon', hiragana: 'ばびぶべぼ', katakana: 'バビブベボ' },
    { id: 'pa', type: 'dakuon', hiragana: 'ぱぴぷぺぽ', katakana: 'パピプペポ' },
    { id: 'kya', type: 'yoon', hiragana: 'きゃ きゅ きょ', katakana: 'キャ キュ キョ' },
    { id: 'sha', type: 'yoon', hiragana: 'しゃ しゅ しょ', katakana: 'シャ シュ ショ' },
    { id: 'cha', type: 'yoon', hiragana: 'ちゃ ちゅ ちょ', katakana: 'チャ チュ チョ' },
    { id: 'nya', type: 'yoon', hiragana: 'にゃ にゅ にょ', katakana: 'ニャ ニュ ニョ' },
    { id: 'hya', type: 'yoon', hiragana: 'ひゃ ひゅ ひょ', katakana: 'ヒャ ヒュ ヒョ' },
    { id: 'mya', type: 'yoon', hiragana: 'みゃ みゅ みょ', katakana: 'ミャ ミュ ミョ' },
    { id: 'rya', type: 'yoon', hiragana: 'りゃ りゅ りょ', katakana: 'リャ リュ リョ' },
    { id: 'gya', type: 'yoon', hiragana: 'ぎゃ ぎゅ ぎょ', katakana: 'ギャ ギュ ギョ' },
    { id: 'ja', type: 'yoon', hiragana: 'じゃ じゅ じょ', katakana: 'ジャ ジュ ジョ' },
    { id: 'bya', type: 'yoon', hiragana: 'びゃ びゅ びょ', katakana: 'ビャ ビュ ビョ' },
    { id: 'pya', type: 'yoon', hiragana: 'ぴゃ ぴゅ ぴょ', katakana: 'ピャ ピュ ピョ' },
]

function romanize(kana: string): string {
    const pairs: Record<string, string> = {
        きゃ: 'kya',
        きゅ: 'kyu',
        きょ: 'kyo',
        しゃ: 'sha',
        しゅ: 'shu',
        しょ: 'sho',
        ちゃ: 'cha',
        ちゅ: 'chu',
        ちょ: 'cho',
        にゃ: 'nya',
        にゅ: 'nyu',
        にょ: 'nyo',
        ひゃ: 'hya',
        ひゅ: 'hyu',
        ひょ: 'hyo',
        みゃ: 'mya',
        みゅ: 'myu',
        みょ: 'myo',
        りゃ: 'rya',
        りゅ: 'ryu',
        りょ: 'ryo',
        ぎゃ: 'gya',
        ぎゅ: 'gyu',
        ぎょ: 'gyo',
        じゃ: 'ja',
        じゅ: 'ju',
        じょ: 'jo',
        びゃ: 'bya',
        びゅ: 'byu',
        びょ: 'byo',
        ぴゃ: 'pya',
        ぴゅ: 'pyu',
        ぴょ: 'pyo',
    }
    const singles: Record<string, string> = {
        あ: 'a',
        い: 'i',
        う: 'u',
        え: 'e',
        お: 'o',
        か: 'ka',
        き: 'ki',
        く: 'ku',
        け: 'ke',
        こ: 'ko',
        さ: 'sa',
        し: 'shi',
        す: 'su',
        せ: 'se',
        そ: 'so',
        た: 'ta',
        ち: 'chi',
        つ: 'tsu',
        て: 'te',
        と: 'to',
        な: 'na',
        に: 'ni',
        ぬ: 'nu',
        ね: 'ne',
        の: 'no',
        は: 'ha',
        ひ: 'hi',
        ふ: 'fu',
        へ: 'he',
        ほ: 'ho',
        ま: 'ma',
        み: 'mi',
        む: 'mu',
        め: 'me',
        も: 'mo',
        や: 'ya',
        ゆ: 'yu',
        よ: 'yo',
        ら: 'ra',
        り: 'ri',
        る: 'ru',
        れ: 're',
        ろ: 'ro',
        わ: 'wa',
        を: 'wo',
        ん: 'n',
        が: 'ga',
        ぎ: 'gi',
        ぐ: 'gu',
        げ: 'ge',
        ご: 'go',
        ざ: 'za',
        じ: 'ji',
        ず: 'zu',
        ぜ: 'ze',
        ぞ: 'zo',
        だ: 'da',
        ぢ: 'ji',
        づ: 'zu',
        で: 'de',
        ど: 'do',
        ば: 'ba',
        び: 'bi',
        ぶ: 'bu',
        べ: 'be',
        ぼ: 'bo',
        ぱ: 'pa',
        ぴ: 'pi',
        ぷ: 'pu',
        ぺ: 'pe',
        ぽ: 'po',
    }
    const normalized = kana.replace(/[ァ-ヶ]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) - 0x60),
    )
    let result = ''
    for (let index = 0; index < normalized.length;) {
        const pair = normalized.slice(index, index + 2)
        if (pairs[pair]) {
            result += pairs[pair]
            index += 2
        } else {
            result += singles[normalized[index] ?? ''] ?? ''
            index += 1
        }
    }
    return result
}

export const kanaEntries: KanaEntry[] = rows.flatMap(({ id, type, hiragana: hiraganaRow, katakana: katakanaRow }) => {
    const hiragana = hiraganaRow.includes(' ')
        ? hiraganaRow.split(' ').filter(Boolean)
        : [...hiraganaRow]
    const katakana = katakanaRow.includes(' ')
        ? katakanaRow.split(' ').filter(Boolean)
        : [...katakanaRow]
    return hiragana.map((value, index) => ({
        hiragana: value,
        katakana: katakana[index] ?? '',
        romaji: romanize(value),
        row: id,
        type,
    }))
})

export const kanaRowIds = rows.map(({ id }) => id)
export const kanaTypes: KanaType[] = ['gojuon', 'dakuon', 'yoon']

export interface KanaSelection {
    rows: KanaRow[]
    types: KanaType[]
}

export function selectKanaEntries(selection: KanaSelection): KanaEntry[] {
    const { rows: selectedRows, types: selectedTypes } = selection
    if (selectedRows.length === 0 && selectedTypes.length === 0) return kanaEntries
    return kanaEntries.filter(
        (entry) => selectedRows.includes(entry.row) || selectedTypes.includes(entry.type),
    )
}

export function createKanaQuestions(
    direction: KanaDirection,
    questionCount: number,
    fullExam: boolean,
    selection: KanaSelection = { rows: [], types: [] },
): VocabularyWord[] {
    const shuffled = [...selectKanaEntries(selection)]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        const current = shuffled[index]!
        shuffled[index] = shuffled[swapIndex]!
        shuffled[swapIndex] = current
    }
    return shuffled.slice(0, fullExam ? shuffled.length : questionCount).map((entry) => {
        const separator = direction.indexOf('-to-')
        const from = direction.slice(0, separator) as KanaScript | 'romaji'
        const to = direction.slice(separator + 4) as KanaScript | 'romaji'
        const prompt = from === 'romaji' ? entry.romaji : entry[from]
        const expected = to === 'romaji' ? entry.romaji : entry[to]
        return {
            contentId: `kana:${entry.hiragana}`,
            word: prompt,
            meaning: expected,
            furigana: '',
            romaji: expected,
            level: 5,
        }
    })
}

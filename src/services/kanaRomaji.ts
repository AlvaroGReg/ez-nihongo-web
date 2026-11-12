const BASIC_KANA: Record<string, string> = {
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
    ゐ: 'wi',
    ゑ: 'we',
    を: 'o',
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
    ゔ: 'vu',
}

const COMBINED_KANA: Record<string, string> = {
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
    ぢゃ: 'ja',
    ぢゅ: 'ju',
    ぢょ: 'jo',
    びゃ: 'bya',
    びゅ: 'byu',
    びょ: 'byo',
    ぴゃ: 'pya',
    ぴゅ: 'pyu',
    ぴょ: 'pyo',
    ふぁ: 'fa',
    ふぃ: 'fi',
    ふぇ: 'fe',
    ふぉ: 'fo',
    うぃ: 'wi',
    うぇ: 'we',
    うぉ: 'wo',
    てぃ: 'ti',
    でぃ: 'di',
    とぅ: 'tu',
    どぅ: 'du',
    しぇ: 'she',
    ちぇ: 'che',
    じぇ: 'je',
    つぁ: 'tsa',
    つぃ: 'tsi',
    つぇ: 'tse',
    つぉ: 'tso',
}

function toHiragana(value: string): string {
    return [...value]
        .map((character) => {
            const codePoint = character.codePointAt(0)!
            return codePoint >= 0x30a1 && codePoint <= 0x30f6
                ? String.fromCodePoint(codePoint - 0x60)
                : character
        })
        .join('')
}

function getGeminatedConsonant(nextSyllable: string): string {
    if (nextSyllable.startsWith('ch')) return 't'
    return /^[bcdfghjklmpqrstvwxyz]/u.exec(nextSyllable)?.[0] ?? ''
}

export function kanaToRomaji(reading: string): string {
    const kana = toHiragana(reading)
    let romaji = ''

    for (let index = 0; index < kana.length; index += 1) {
        const character = kana[index]!
        if (character === 'っ') {
            const nextSyllable =
                COMBINED_KANA[kana.slice(index + 1, index + 3)] ??
                BASIC_KANA[kana[index + 1]!] ??
                ''
            romaji += getGeminatedConsonant(nextSyllable)
            continue
        }

        if (character === 'ー') {
            romaji += /[aeiou]$/u.exec(romaji)?.[0] ?? ''
            continue
        }

        const combined = COMBINED_KANA[kana.slice(index, index + 2)]
        if (combined) {
            romaji += combined
            index += 1
            continue
        }

        romaji += BASIC_KANA[character] ?? character
    }

    return romaji
}

const LONG_VOWEL_ALIASES: Record<string, string> = {
    aa: 'ā',
    ee: 'ē',
    ii: 'ī',
    oo: 'ō',
    ou: 'ō',
    uu: 'ū',
}

export interface RomajiSearchReading {
    kana: string
    forms: string[]
}

export function createRomajiSearchReading(reading: string): RomajiSearchReading {
    return {
        kana: reading.replace(/[.-]/g, ''),
        forms: kanaToRomajiSearchForms(reading),
    }
}

export function kanaToRomajiSearchForms(reading: string): string[] {
    const forms = new Set([kanaToRomaji(reading)])
    for (const form of forms) {
        for (const [spelling, macron] of Object.entries(LONG_VOWEL_ALIASES)) {
            if (!form.includes(spelling)) continue
            forms.add(form.split(spelling).join(macron))
        }
    }
    return [...forms]
}

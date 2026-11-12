import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { addVocabulary, addKanji, addCatalog } = vi.hoisted(() => ({
    addVocabulary: vi.fn(),
    addKanji: vi.fn(),
    addCatalog: vi.fn(),
}))

vi.mock('@/stores/knownContent', () => ({
    knownContent: { addVocabulary, addKanji, addCatalog },
}))
vi.mock('@/services/vocabulary', () => ({ loadLocalCatalog: vi.fn().mockResolvedValue([]) }))
vi.mock('@/services/kanji', () => ({ loadKanjiCatalog: vi.fn().mockResolvedValue([]) }))

import KnownContentAddDialog from '@/components/known-content/KnownContentAddDialog.vue'

describe('KnownContentAddDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        addVocabulary.mockResolvedValue({})
        addKanji.mockResolvedValue({})
        addCatalog.mockResolvedValue({ alreadyPresent: false })
    })

    it('submits a custom vocabulary item and announces success', async () => {
        const wrapper = mount(KnownContentAddDialog, { props: { contentType: 'vocabulary' } })
        await flushPromises()
        expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
        expect(wrapper.find('form').exists()).toBe(true)
        expect(wrapper.get('select').element.value).toBe('vocabulary')
        await wrapper.findAll('button.button-quiet').find((button) => button.text().includes('Browse the catalog'))!.trigger('click')
        expect(wrapper.find('select').exists()).toBe(true)
        await wrapper.findAll('button.button-quiet').find((button) => button.text().includes('Create custom content'))!.trigger('click')
        const fields = wrapper.findAll('input')
        await fields[0]!.setValue('語彙')
        await fields[1]!.setValue('ごい')
        await fields[2]!.setValue('goi')
        await fields[3]!.setValue('vocabulary')
        await wrapper.get('form').trigger('submit')
        await flushPromises()
        expect(addVocabulary).toHaveBeenCalledWith({ word: '語彙', reading: 'ごい', romaji: 'goi', meaning: 'vocabulary' }, 'en')
        expect(wrapper.text()).toContain('Added to your known-content list.')
    })

    it('does not submit a kanji form with no readings', async () => {
        const wrapper = mount(KnownContentAddDialog, { props: { contentType: 'vocabulary' } })
        await flushPromises()
        await wrapper.get('select').setValue('kanji')
        expect(wrapper.findAll('textarea')).toHaveLength(2)
        await wrapper.findAll('input')[0]!.setValue('学')
        await wrapper.findAll('textarea')[0]!.setValue('')
        await wrapper.findAll('textarea')[1]!.setValue('study')
        await wrapper.get('form').trigger('submit')
        await flushPromises()
        expect(addKanji).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('Check the required fields and their allowed lengths and formats.')
    })

    it('offers to add the matching catalog kanji after a custom entry is rejected as a catalog duplicate', async () => {
        addKanji.mockRejectedValue(Object.assign(new Error('catalog-duplicate'), {
            code: 'catalog-duplicate',
            contentType: 'kanji',
            catalogContentId: 'kanji:学',
        }))
        const wrapper = mount(KnownContentAddDialog, { props: { contentType: 'kanji' } })
        await flushPromises()
        await wrapper.findAll('input')[0]!.setValue('学')
        await wrapper.findAll('textarea')[0]!.setValue('がく')
        await wrapper.findAll('textarea')[1]!.setValue('study')
        await wrapper.get('form').trigger('submit')
        await flushPromises()

        expect(wrapper.text()).toContain('An equivalent entry exists in the catalog.')
        const addCatalogButton = wrapper.findAll('button').find((button) => button.text() === 'Add catalog entry')
        expect(addCatalogButton).toBeDefined()
        await addCatalogButton!.trigger('click')
        await flushPromises()

        expect(addCatalog).toHaveBeenCalledWith('kanji', 'kanji:学', 'en')
        expect(wrapper.text()).toContain('Added to your known-content list.')
    })

    it('offers to add the matching catalog vocabulary after a custom entry is rejected as a catalog duplicate', async () => {
        addVocabulary.mockRejectedValue(Object.assign(new Error('catalog-duplicate'), {
            code: 'catalog-duplicate',
            contentType: 'vocabulary',
            catalogContentId: 'vocabulary:語彙:ごい',
        }))
        const wrapper = mount(KnownContentAddDialog, { props: { contentType: 'vocabulary' } })
        await flushPromises()
        const fields = wrapper.findAll('input')
        await fields[0]!.setValue('語彙')
        await fields[1]!.setValue('ごい')
        await fields[2]!.setValue('goi')
        await fields[3]!.setValue('vocabulary')
        await wrapper.get('form').trigger('submit')
        await flushPromises()

        const addCatalogButton = wrapper.findAll('button').find((button) => button.text() === 'Add catalog entry')
        expect(addCatalogButton).toBeDefined()
        await addCatalogButton!.trigger('click')
        await flushPromises()

        expect(addCatalog).toHaveBeenCalledWith('vocabulary', 'vocabulary:語彙:ごい', 'en')
        expect(wrapper.text()).toContain('Added to your known-content list.')
    })
})

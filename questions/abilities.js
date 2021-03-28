import AbilityModel from '../models/ability'
import {findOneRandom, findRandom} from '../db'
import {flatten, randomIndex, selectRandom, shuffle} from '../utils'
import {GENERAL_OPTIONS, YES_NO_OPTIONS} from './options'
import {getWowheadSpecializations, getWowheadSpellsTable, WoWExpansion, WOWHEAD_URL} from "../wowhead";
import {classes} from "../enums";
import fetch from "node-fetch";
import cheerio from "cheerio";

const getIconLink = (iconName) => `https://wow.zamimg.com/images/wow/icons/medium/${iconName}.jpg`
const getSpellLink = (wowexp, id) => `${WOWHEAD_URL[wowexp]}spell=${id}`

const petAbilities = new Set()
petAbilities.add('Great Stamina')
petAbilities.add('Growl')
petAbilities.add('Shadow Resistance')
petAbilities.add('Nature Resistance')
petAbilities.add('Fire Resistance')
petAbilities.add('Frost Resistance')
petAbilities.add('Arcane Resistance')
petAbilities.add('Natural Armor')

const classSpecializations = {
    Mage: [
        {name: 'Fire', id: 41},
        {name: 'Frost', id: 61},
        {name: 'Arcane', id: 81},
    ],
    Warrior: [
        {name: 'Arms', id: 161},
        {name: 'Protection', id: 163},
        {name: 'Fury', id: 164},
    ],
    Rogue: [
        {name: 'Combat', id: 181},
        {name: 'Assasination', id: 182},
        {name: 'Subtlety', id: 183},
    ],
    Priest: [
        {name: 'Discipline', id: 201},
        {name: 'Holy', id: 202},
        {name: 'Shadow', id: 203},
    ],
    Shaman: [
        {name: 'Elemental', id: 261},
        {name: 'Restoration', id: 262},
        {name: 'Enhacement', id: 263},
    ],
    Druid: [
        {name: 'Feral', id: 281},
        {name: 'Restoration', id: 282},
        {name: 'Balance', id: 283},
    ],
    Warlock: [
        {name: 'Destruction', id: 301},
        {name: 'Affliction', id: 302},
        {name: 'Demonology', id: 303},
    ],
    Hunter: [
        {name: 'Beast Mastery', id: 361},
        {name: 'Survival', id: 362},
        {name: 'Marksmanship', id: 363},
    ],
    Paladin: [
        {name: 'Retribution', id: 381},
        {name: 'Holy', id: 382},
        {name: 'Protection', id: 383},
    ]
}

const abilityIconQuestion = (text, getQuery) => async (wowexp) => {
    const options = GENERAL_OPTIONS
    const query = getQuery(wowexp)
    const {spellsTable, iconsTable} = await getWowheadSpellsTable(wowexp, query)
    const iconsArray = shuffle(Object.values(iconsTable).filter(spell => !petAbilities.has(spell.name_enus)))
    const correctSpellIcon = iconsArray[0]
    let correctText = correctSpellIcon.name_enus

    const correctSpell = spellsTable.find(spell => spell.name === correctText)
    const talentSpecId = correctSpell.talentspec ? correctSpell.talentspec[0] : null
    if (talentSpecId) {
        let className
        let specName
        Object.keys(classSpecializations).forEach(c => {
            if (className) {
                return
            }
            const specs = classSpecializations[c]
            specs.forEach(spec => {
                if (spec.id === talentSpecId) {
                    className = c
                    specName = spec.name
                }
            })
        })
        if (className) {
            correctText += ` (${specName} ${className})`
        }
    }

    const optionsTexts = iconsArray
        .filter(spell => spell.icon !== correctSpellIcon.icon)
        .slice(0, 3)
        .map(spell => spell.name_enus)
    optionsTexts.push(correctSpell.name)
    shuffle(optionsTexts)
    const correctIndex = optionsTexts.findIndex(spellName => spellName === correctSpell.name)
    const link = getSpellLink(wowexp, correctSpell.id)
    const image = getIconLink(correctSpellIcon.icon)
    const correctOption = options[correctIndex]
    return {text, options, optionsTexts, correctOption, correctText, link, image}
}

export default [
    {
        expansions: [WoWExpansion.Classic, WoWExpansion.TBC],
        generator: abilityIconQuestion(
            'What ability does have this icon?',
            wowexp => wowexp === WoWExpansion.TBC ? 'abilities?filter=10:16;1:2;0:0' : 'abilities?filter=10;1;0'
        )
    },
    {
        expansions: [WoWExpansion.Classic],
        generator: abilityIconQuestion('What talent does have this icon?', () => 'talents?filter=12;1;0'),
    },
    {
        expansions: [WoWExpansion.Classic],
        generator: async (wowexp) => {
            const options = GENERAL_OPTIONS
            const query = `abilities?filter=10;1;0`
            const {spellsTable} = await getWowheadSpellsTable(wowexp, query)
            const shuffledSpells = shuffle(spellsTable.filter(spell => !petAbilities.has(spell.name) || spell.level === 0))
            const optionsSpells = []
            let i = 0
            do {
                if (!optionsSpells.find(spell => spell.level === shuffledSpells[i].level)) {
                    optionsSpells.push(shuffledSpells[i])
                }
                i++
            } while (optionsSpells.length < 4)
            const sortedOptionSpells = optionsSpells.map(x => x).sort((a, b) => a.level - b.level)
            const correctSpell = sortedOptionSpells[0]
            const text = `Which one of the following spells you can know at the *lowest level?*`
            const optionsTexts = optionsSpells.map(spell => spell.name)
            const correctText = `${correctSpell.name} at level ${correctSpell.level} (${sortedOptionSpells.slice(1).map(spell => `${spell.name}: ${spell.level}`).join(', ')})`
            const link = getSpellLink(wowexp, correctSpell.id)
            const correctOption = options[optionsTexts.findIndex(spellName => spellName === correctSpell.name)]
            return {text, options, optionsTexts, correctOption, correctText, link}
        },
    },
    {
        expansions: [WoWExpansion.Classic],
        generator: async (wowexp) => {
            const options = GENERAL_OPTIONS
            const className = selectRandom(Object.keys(classSpecializations))
            const correctSpec = selectRandom(classSpecializations[className])
            const optionsTexts = [...new Set(
                shuffle(flatten(Object.values(classSpecializations)))
                    .map(spec => spec.name)
                    .filter(specName => specName !== correctSpec.name)
            )].slice(0, options.length - 1)
            optionsTexts.push(correctSpec.name)
            shuffle(optionsTexts)
            const correctIndex = optionsTexts.findIndex(specName => specName === correctSpec.name)
            const correctOption = options[correctIndex]
            const text = 'What talent tree does have this background?'
            const correctText = `${correctSpec.name} (${className})`
            const link = `${WOWHEAD_URL[wowexp]}talent-calc/${className.toLowerCase()}`
            const image = `https://wow.zamimg.com/images/wow/talents/backgrounds/classic/${correctSpec.id}.jpg`
            return {text, options, optionsTexts, correctOption, correctText, link, image}
        },
    }
]

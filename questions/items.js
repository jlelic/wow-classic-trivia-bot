import {formatOptions, randomIndex, selectRandom, shuffle} from '../utils'
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import {CLASS_OPTIONS, GENERAL_OPTIONS} from './options'
import {
    getMainScreenshotUrl,
    getWowheadItemSetsTable,
    getWowheadItemsTable,
    getWowheadTable, WoWExpansion,
    WOWHEAD_URL
} from "../wowhead";
import {classes, classToFilter, reqClassToName} from "../enums";
import {findRandom} from "../db";
import item from "../models/item";

export const loadTooltip = async (wowexp, url) => {
    console.log('loading tooltip ' + url)
    const result = await fetch(`${WOWHEAD_URL[wowexp]}tooltip/${url}`)
    const htmlText = await result.text()
    return cheerio.load(JSON.parse(htmlText).tooltip)
}

const getFlavorText = async (wowexp, itemId) => {
    const $ = await loadTooltip(wowexp, `item/${itemId}`)
    return $('.q').last().text()
}

const getItemSetImgUrl = async (wowexp, itemSetId) => {
    const $ = await loadTooltip(wowexp, `item-set/${itemSetId}`)
    const womanMaleUrl = $('source')[0].attribs.srcset
    const gnomeUrl = womanMaleUrl.replace('item-set/1', 'item-set/7')
    return gnomeUrl
}

const getItemLink = (wowexp, itemId) => `${WOWHEAD_URL[wowexp]}item=${itemId}`

const getSourceQuestion = (query) => async (wowexp) => {
    const options = GENERAL_OPTIONS
    const wowheadTable = await getWowheadItemsTable(wowexp, query)
    const optionsTable = shuffle(wowheadTable.filter(item => item.sourcemore && item.sourcemore[0].n))
    const correctItem = optionsTable[0]
    const optionsTexts = [...new Set(
        optionsTable
            .filter(item => item.sourcemore[0].n !== correctItem.sourcemore[0].n)
            .map(option => option.sourcemore[0].n)
    )].slice(0, options.length - 1)
    const correctText = correctItem.sourcemore[0].n
    optionsTexts.push(correctText)
    shuffle(optionsTexts)
    const correctIndex = optionsTexts.findIndex(option => option === correctText)
    const itemName = correctItem.name
    const text = `Who/what drops *${itemName}*?`
    const link = getItemLink(wowexp, correctItem.id)
    const correctOption = options[correctIndex]
    return {text, options, optionsTexts, correctOption, correctText, link}
}

const Stat = {
    Agility: 'agi',
    AttackPower: 'atkpwr',
    BlockChance: 'blockpct',
    BlockValue: 'blockamoun',
    Defense: 'def',
    DodgeChance: 'dodgepct',
    Intellect: 'int',
    // FireResistance: 'firres',
    // FrostResistance: 'frores',
    // ArcaneSpellDamage: 'arcsplpwr',
    // FrostSpellDamage: 'frosplpwr',
    // FireSpellDamage: 'firsplpwr',
    HealthRegen: 'healthrgn',
    ManaRegen: 'manargn',
    CritChance: 'mlecritstrkpct',
    HitChance: 'mlehitpct',
    ParryChance: 'parrypct',
    Spirit: 'spi',
    Stamina: 'sta',
    Strength: 'str',
    BonusHealing: 'splheal',
    SpellPower: 'splpwr',
    SpellHit: 'splhitpct',
    SpellCritChance: 'splcritstrkpct',
}

const Role = {
    Tank: 'tank',
    PhysicalDPS: 'physicalDps',
    CasterDPS: 'casterDps',
    Healer: 'Healer'
}

const extraStats = {
    [Role.PhysicalDPS]: [
        Stat.Agility,
        Stat.AttackPower,
        Stat.CritChance,
        Stat.Strength,
        Stat.HitChance
    ],
    [Role.Tank]: [
        Stat.Agility,
        Stat.Strength,
        Stat.Stamina,
        Stat.Defense,
        Stat.DodgeChance,
        Stat.ParryChance,
        Stat.HitChance,
        Stat.BlockChance,
        Stat.BlockValue,
        Stat.HealthRegen
    ],
    [Role.CasterDPS]: [
        Stat.SpellPower,
        Stat.SpellCritChance,
        Stat.Intellect,
        Stat.SpellHit,
        Stat.Spirit
    ],
    [Role.Healer]: [
        Stat.BonusHealing,
        Stat.SpellCritChance,
        Stat.Intellect,
        Stat.Spirit,
        Stat.ManaRegen
    ]
}

const stats = {
    [Stat.Agility]: 'Agility',
    [Stat.AttackPower]: 'Attack Power',
    [Stat.BlockChance]: '% Block Chance',
    [Stat.BlockValue]: 'Block Value',
    [Stat.Defense]: 'Defense',
    [Stat.DodgeChance]: '% Dodge Chance',
    [Stat.Intellect]: 'Intellect',
    // [Stat.FireResistance]: 'Fire Resistance',
    // [Stat.FrostResistance]: 'Frost Resistance',
    // [Stat.ArcaneSpellDamage]: 'Arcane Spell Damage',
    // [Stat.FrostSpellDamage]: 'Frost Spell Damage',
    // [Stat.FireSpellDamage]: 'Fire Spell Damage',
    [Stat.HealthRegen]: 'Health Regen',
    [Stat.ManaRegen]: 'Mana Regen',
    [Stat.HitChance]: '% Hit Chance',
    [Stat.CritChance]: '% Crit Chance',
    [Stat.ParryChance]: '% Parry Chance',
    [Stat.Spirit]: 'Spirit',
    [Stat.Stamina]: 'Stamina',
    [Stat.Strength]: 'Strength',
    [Stat.BonusHealing]: 'Bonus Healing',
    [Stat.SpellPower]: 'Spell Power',
    [Stat.SpellHit]: '% Spell Hit Chance',
    [Stat.SpellCritChance]: '% Spell Crit Chance',

}

const getItemRole = item => {
    if (item[Stat.Defense]) {
        return Role.Tank
    }

    if (item[Stat.BonusHealing]) {
        return Role.Healer
    }

    if (item[Stat.SpellPower] || item[Stat.SpellHit]) {
        return Role.CasterDPS
    }

    if (item[Stat.Intellect] || item[Stat.Spirit] || item[Stat.ManaRegen]) {
        return Role.Healer
    }

    if (item[Stat.AttackPower] || item[Stat.CritChance]) {
        return Role.PhysicalDPS
    }

    return Role.Tank
}

const WeaponType = {
    Dagger: 15,
    FistWeapon: 13,
    OneHandedAxe: 0,
    OneHandedMace: 4,
    OneHandedSword: 7,
    Polearm: 6,
    Staff: 10,
    TwoHandedAxe: 1,
    TwoHandedMace: 5,
    TwoHandedSword: 8,
    Bow: 2,
    Wand: 19
}

const itemSetTags = {
    1: 'Tier 0',
    2: 'Tier 0.5',
    3: 'Tier 1',
    4: 'Tier 2',
    5: 'Tier 3',
    6: 'Rare PvP Set',
    8: 'Epic PvP Set',
    9: 'AQ20 Set',
    10: 'Tier 2.5',
    11: 'ZG Set',
    12: 'Tier 4',
    13: 'Tier 5',
    14: 'TBC Dungeon Set',
    17: 'Season 1',
    18: 'Tier 6',
    19: 'Season 2',
    20: 'Season 3',
    22: 'Season 4',
}

export default [
    {
        expansions: [WoWExpansion.Classic],
        generator: async (wowexp) => {
            const options = GENERAL_OPTIONS
            const query = 'items?filter=7;1;0'
            const wowheadTable = await getWowheadItemsTable(wowexp, query)
            const optionsSet = new Set()
            const correctIndex = randomIndex(wowheadTable)
            const correctFlavor = await getFlavorText(wowexp, wowheadTable[correctIndex].id)
            optionsSet.add(correctIndex)
            let optionFlavor
            let optionIndex
            do {
                optionIndex = randomIndex(wowheadTable)
                if (optionsSet.has(optionIndex)) {
                    continue
                }
                optionFlavor = await getFlavorText(wowexp, wowheadTable[optionIndex].id)
                if (optionFlavor === correctFlavor) {
                    continue
                }
                optionsSet.add(optionIndex)
            } while (optionsSet.size < options.length)

            const optionsTexts = shuffle([...optionsSet].map(index => wowheadTable[index].name))
            const correctText = wowheadTable[correctIndex].name
            const correctOption = options[optionsTexts.findIndex(t => t === correctText)]


            let text = `What item has flavor text *${correctFlavor}*?`

            const link = `${WOWHEAD_URL[wowexp]}item=${wowheadTable[correctIndex].id}`
            return {text, options, optionsTexts, correctOption, correctText, link}
        },
    },
    {
        expansions: [WoWExpansion.Classic],
        generator: async (wowexp) => {
            const options = CLASS_OPTIONS
            const correctIndex = Math.floor(Math.random() * 9)
            const query = wowexp === WoWExpansion.TBC ? `items?filter=152:166;${classToFilter[correctIndex]}:2;0:0` : `items?filter=152;${classToFilter[correctIndex]};0`
            const wowheadTable = await getWowheadItemsTable(wowexp, query)
            const filteredTable = shuffle(wowheadTable.filter(
                item => item.name !== 'Royal Seal of Eldre\'Thalas'
                    && item.name !== 'Insignia of the Alliance'
                    && item.name !== 'Insignia of the Horde'
                    && item.name !== 'Punctured Voodoo Doll'
            ))
            let item
            do {
                item = selectRandom(filteredTable)
            } while ((item.reqclass | (item.reqclass - 1)) !== (2 * item.reqclass - 1))
            const text = `Which class can use *${item.name}*?`
            const correctText = classes[correctIndex]
            const link = `${WOWHEAD_URL[wowexp]}item=${item.id}`
            const correctOption = CLASS_OPTIONS[correctIndex]
            return {text, options, correctOption, correctText, link}

        },
    },
    {
        expansions: [WoWExpansion.Classic],
        generator: getSourceQuestion('items/weapons/min-req-level:0/quality:3:4?filter=128;4;0'),
    },
    {
        expansions: [WoWExpansion.Classic],
        generator: getSourceQuestion('items/armor/min-level:58/quality:3:4?filter=128:12;4:2;0:0'),
    },
    {
        expansions: [WoWExpansion.Classic],
        generator: async (wowexp) => {
            const options = ['🔥', '🐲', '🐛', '💀']
            const optionsTexts = ['Molten Core', 'Blackwing Lair', 'Ahn\'Qiraj', 'Naxxramas']
            const raidToFilter = [2717, 2677, 3428, 3456]
            const correctIndex = randomIndex(options)
            const correctOption = options[correctIndex]
            const correctText = optionsTexts[correctIndex]
            const query = `items/quality:4?filter=214:195;${raidToFilter[correctIndex]}:1;0:0`
            const wowTable = await getWowheadItemsTable(wowexp, query)
            const item = shuffle(wowTable)[0]
            const text = `What raid does *${item.name}* drop in?`
            const link = getItemLink(wowexp, item.id)

            return {text, options, optionsTexts, correctOption, correctText, link}
        },
    },
    {
        expansions: [WoWExpansion.Classic],
        generator: async (wowexp) => {
            const options = GENERAL_OPTIONS
            const query = `items/min-level:60/quality:4?filter=12:195;2:1;0:0`
            const itemsTable = await getWowheadItemsTable(wowexp, query)
            const item = shuffle(itemsTable).filter(item => {
                let numStats = 0
                Object.keys(stats).forEach(stat => {
                    if (item[stat]) {
                        numStats++
                    }
                })
                return numStats >= 3
            })[0]

            const presentStats = Object.keys(stats).filter(stat => item[stat])
            const role = getItemRole(item)
            const extraStat = shuffle(extraStats[role].filter(stat => !presentStats.includes(stat)))[0]
            const optionsStats = shuffle(presentStats).slice(0, options.length - 1)
            optionsStats.push(extraStat)
            shuffle(optionsStats)

            const text = `Which of the following stats you *cannot* find on *${item.name}*?`
            const optionsTexts = optionsStats.map(stat => stats[stat])
            const correctText = `${stats[extraStat]}, ${item.name} gives: ${presentStats.map(stat => `${item[stat]} ${stats[stat]}`).join(', ')}`
            const correctIndex = optionsStats.findIndex(stat => stat === extraStat)
            const correctOption = options[correctIndex]
            const link = getItemLink(wowexp, item.id)

            return {text, options, optionsTexts, correctOption, correctText, link}
        },
    },
    {
        expansions: [WoWExpansion.Classic, WoWExpansion.TBC],
        generator: async (wowexp) => {
            const options = GENERAL_OPTIONS
            let query = 'item-sets'
            if (wowexp === WoWExpansion.TBC) {
                query += '?filter=13;2;0'
            }
            const wowheadTable = await getWowheadItemSetsTable(wowexp, query)
            const itemSets = shuffle(wowheadTable.filter(
                itemSet => itemSet.note !== 7 && itemSet.note !== 16 && itemSet.note !== 21
            )).slice(0, GENERAL_OPTIONS.length)
            const correctIndex = randomIndex(itemSets)
            const itemSet = itemSets[correctIndex]
            const optionsTexts = itemSets.map(itemSet => itemSet.name)
            let correctText = optionsTexts[correctIndex]
            if(itemSetTags[itemSet.note]) {
                correctText += ` (${reqClassToName[itemSet.reqclass]} ${itemSetTags[itemSet.note]})`
            }
            const correctOption = options[correctIndex]
            const image = await getItemSetImgUrl(wowexp, itemSet.id)
            const text = `What's the name of this item set?`
            const link = `${WOWHEAD_URL[wowexp]}item-set=${itemSet.id}`
            return {text, options, optionsTexts, correctOption, correctText, link, image}
        },
    },
    {
        expansions: [WoWExpansion.Classic, WoWExpansion.TBC],
        generator: async (wowexp) => {
            const options = GENERAL_OPTIONS
            const weaponType = selectRandom([
                ...Object.values(WeaponType),
                WeaponType.Dagger,
                WeaponType.OneHandedAxe,
                WeaponType.OneHandedMace,
                WeaponType.OneHandedSword,
                WeaponType.TwoHandedAxe,
                WeaponType.TwoHandedMace,
                WeaponType.TwoHandedSword,
                WeaponType.Staff,
                WeaponType.Bow,
            ])
            const minLevel = wowexp === WoWExpansion.TBC ? 93 : 60
            const query = `items/weapons/min-level:${minLevel}/quality:4/type:${weaponType}?filter=113;1;0`
            const wowheadTable = await getWowheadItemsTable(wowexp, query)
            const optionsItems = shuffle(wowheadTable).slice(0, options.length)
            const correctIndex = randomIndex(optionsItems)
            const correctItem = optionsItems[correctIndex]
            const itemUrl = `item=${correctItem.id}`
            const image = await getMainScreenshotUrl(wowexp, itemUrl)
            const link = `${WOWHEAD_URL[wowexp]}${itemUrl}`
            const correctText = correctItem.name
            const correctOption = options[correctIndex]
            const optionsTexts = optionsItems.map(item => item.name)
            const text = 'What\'s the name this weapon?'
            return {text, options, optionsTexts, correctOption, correctText, link, image}
        }
    }
]

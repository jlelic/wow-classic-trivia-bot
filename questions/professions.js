import NpcModel from '../models/npc'
import {findOneRandom, findRandom} from '../db'
import {formatOptions, shuffle} from '../utils'
import {GENERAL_OPTIONS, RARITY_OPTIONS, TRIBE_OPTIONS, YES_NO_OPTIONS} from './options'
import {ranks, tribes} from '../enums'
import {getWowheadItemsTable, getWowheadSpellsTable, getWowheadTable, WoWExpansion, WOWHEAD_URL} from "../wowhead";
import {zones, zonesMap} from './zones'
import fetch from "node-fetch";
import cheerio from "cheerio";

const getZones = async (wowexp, query) => {
    const result = await fetch(`${WOWHEAD_URL[wowexp]}${query}`)
    const htmlText = await result.text()
    const $ = cheerio.load(htmlText)
    const locationElements = $('#locations > a')
    return locationElements.contents().map((index, element) => element.data).toArray()
}

const getWhereCantFindQuestion = (query) => async (wowexp) => {
    const options = GENERAL_OPTIONS
    const wowheadTable = await getWowheadTable(wowexp, query)
    const originalHerb = shuffle(wowheadTable.data.filter(herb => herb.location && herb.location.length >= 3))[0]
    const allIds = wowheadTable.data.filter(herb => herb.name === originalHerb.name).map(herb => herb.id)
    const allZones = []
    for (let id of allIds) {
        const zones = await getZones(wowexp, `object=${id}`)
        zones.forEach(zone => allZones.push(zone))
    }
    const zone = shuffle(
        zones.filter(
            zone => (zone.category === 1 || zone.category == 2)
                && !zone.instance
                && (zone.minlevel != 1 || zone.maxlevel != 60)
                && !allZones.includes(zone.name)
        )
    )[0]
    const correctText = zone.name
    const optionsTexts = shuffle(allZones).slice(0, 3)
    optionsTexts.push(correctText)
    shuffle(optionsTexts)
    const correctIndex = optionsTexts.findIndex(zoneName => zoneName === correctText)
    const correctOption = options[correctIndex]
    const text = `In which of the following zones you *cannot* find *${originalHerb.name}*?`
    const link = `${WOWHEAD_URL[wowexp]}object=${originalHerb.id}`
    return {text, options, optionsTexts, correctOption, correctText, link}
}

export default [
    {
        expansions: [WoWExpansion.Classic],
        generator: getWhereCantFindQuestion('objects/herbs'),
    },
    {
        expansions: [WoWExpansion.Classic],
        generator: getWhereCantFindQuestion('objects/mineral-veins'),
    },
    {
        expansions: [WoWExpansion.Classic],
        generator: async (wowexp) => {
            const options = GENERAL_OPTIONS
            const query = 'items?filter=69:68:71:72;1:2:2:2;0:0:0:0'
            const wowheadTable = await getWowheadItemsTable(wowexp, query)
            const fish = shuffle(wowheadTable.filter(item => item.classs !== 15 && !item.sourcemore && item.name !== 'Zulian Mudskunk'))[0]
            const fishZones = await getZones(wowexp, `item=${fish.id}`)
            const optionsTexts = shuffle(zones.map(zone => zone.name).filter(name => !fishZones.includes(name))).slice(0, 3)
            const correctText = shuffle(fishZones)[0]
            optionsTexts.push(correctText)
            shuffle(optionsTexts)
            const correctIndex = optionsTexts.findIndex(zoneName => zoneName === correctText)
            const correctOption = options[correctIndex]
            const text = `In which zone you can fish *${fish.name}*?`
            const link = `${WOWHEAD_URL[wowexp]}item=${fish.id}`

            return {text, options, optionsTexts, correctOption, correctText, link}
        },
    }
]

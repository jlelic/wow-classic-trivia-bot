import NpcModel from '../models/npc'
import {findOneRandom, findRandom} from '../db'
import {randomIndex, shuffle} from '../utils'
import {GENERAL_OPTIONS, RARITY_OPTIONS, TRIBE_OPTIONS, YES_NO_OPTIONS} from './options'
import {ranks, tribes} from '../enums'
import {getMainScreenshotUrl, getWowheadTable, WoWExpansion, WOWHEAD_URL} from "../wowhead";
import {zones, zonesMap} from './zones'
import fetch from "node-fetch";

const type = [
    'beasts',
    'critters',
    'demons',
    'dragonkin',
    'elementals',
    'giant',
    'humanoids',
    'mechanicals',
    'undead',
]

export default [
    {
        expansions: [WoWExpansion.Classic, WoWExpansion.TBC],
        generator: async (wowexp) => {
            const options = GENERAL_OPTIONS
            const queries = {
                [WoWExpansion.Classic]: 'npcs?filter=32:31;1:1;0:0',
                [WoWExpansion.TBC]: 'npcs?filter=32:31:39;1:1:2;0:0:0'
            }
            const query = queries[wowexp]
            const wowheadTable = await getWowheadTable(wowexp, query)
            const optionsNpcs = shuffle(wowheadTable.data).slice(0, options.length)
            const correctIndex = randomIndex(optionsNpcs)
            const correctNpc = optionsNpcs[correctIndex]
            const npcUrl = `npc=${correctNpc.id}`
            const image = await getMainScreenshotUrl(wowexp, npcUrl)
            const link = `${WOWHEAD_URL[wowexp]}${npcUrl}`
            const correctText = correctNpc.name
            const correctOption = options[correctIndex]
            const optionsTexts = optionsNpcs.map(npc => npc.name)
            const text = 'What\'s the name of this boss?'
            return {text, options, optionsTexts, correctOption, correctText, link, image}
        },
    },
    {
        expansions: [WoWExpansion.Classic],
        generator: async (wowexp) => {
            const options = GENERAL_OPTIONS
            const query = 'npcs?filter=32:31;1:1;0:0'
            const wowheadTable = await getWowheadTable(wowexp, query)
            const shuffledTable = shuffle(wowheadTable.data)
            const optionsNpcs = []
            let i = 0
            do {
                const npc = shuffledTable[i]
                if (
                    npc.location
                    && npc.location.length === 1
                    && zonesMap[npc.location[0]]
                    && !optionsNpcs.find(x => x.location[0] === npc.location[0])
                ) {
                    optionsNpcs.push(npc)
                }
                i++
            } while (optionsNpcs.length < options.length)

            const correctIndex = randomIndex(optionsNpcs)
            const correctNpc = optionsNpcs[correctIndex]
            const npcUrl = `npc=${correctNpc.id}`
            const image = await getMainScreenshotUrl(wowexp, npcUrl)
            const link = `${WOWHEAD_URL[wowexp]}${npcUrl}`
            const correctText = `${correctNpc.name} can be found in ${zonesMap[correctNpc.location[0]].name}`
            const correctOption = options[correctIndex]
            const optionsTexts = optionsNpcs.map(npc => zonesMap[npc.location[0]].name)
            const text = 'Where can you find this boss?'
            return {text, options, optionsTexts, correctOption, correctText, link, image}
        },
    },
    {
        expansions: [WoWExpansion.Classic],
        generator: async (wowexp,) => {
            const options = GENERAL_OPTIONS
            const [oddType, commonType] = shuffle(type).slice(0, 2)

            const wowheadTableOdd = await getWowheadTable(wowexp, `npcs/${oddType}?filter=31;1;0`)
            const oddNpc = shuffle(wowheadTableOdd.data)[0]

            const wowheadTableCommon = await getWowheadTable(wowexp, `npcs/${commonType}?filter=31;1;0`)
            const commonNpcs = shuffle(wowheadTableCommon.data).slice(0, options.length - 1)

            const optionsTexts = commonNpcs.map(npc => npc.name)
            optionsTexts.push(oddNpc.name)
            shuffle(optionsTexts)

            const correctIndex = optionsTexts.findIndex(npcName => npcName === oddNpc.name)
            const npcUrl = `npc=${oddNpc.id}`
            const spoilerImage = await getMainScreenshotUrl(wowexp, npcUrl)
            const link = `${WOWHEAD_URL[wowexp]}${npcUrl}`
            const correctOption = options[correctIndex]
            const text = 'Which one of these NPCs is of different types than the others?'
            const oddTypeSingular = oddType.endsWith('s') ? oddType.slice(0, oddType.length - 1) : oddType
            const correctText = `${oddNpc.name} is ${oddTypeSingular}, others are ${commonType}`
            return {text, options, optionsTexts, correctOption, correctText, link, spoilerImage}
        },
    }
]

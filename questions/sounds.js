import {formatOptions, randomIndex, selectRandom, shuffle} from '../utils'
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import {CLASS_OPTIONS, GENERAL_OPTIONS} from './options'
import {getWowheadTable, WOWHEAD_URL} from "../wowhead";
import {classes} from "../enums";
import {WoWExpansion} from "../wowhead";

const races = [
    'Human',
    'Dwarf',
    'Gnome',
    'Night Elf',
    'Undead',
    'Troll',
    'Orc',
    'Tauren',
]

export default [{
    expansions: [WoWExpansion.Classic, WoWExpansion.TBC],
    generator: async (wowexp) => {
        const options = GENERAL_OPTIONS
        const expRaces = [...races]
        if (wowexp === WoWExpansion.TBC) {
            expRaces.push('Draenei')
            expRaces.push('Blood Elf')
        }
        const optionsTexts = shuffle(expRaces).slice(0, options.length)
        const correctRace = optionsTexts[0]
        const query = `sounds/name:${optionsTexts[0].toLowerCase().replace(/\s/g, '')}${Math.random() < 0.5 ? 'female' : 'male'}`
        const wowheadTable = await getWowheadTable(wowexp, query)
        const soundGroup = selectRandom(wowheadTable.data)
        const sound = selectRandom(soundGroup.files).url

        shuffle(optionsTexts)
        const correctIndex = optionsTexts.findIndex(option => option === correctRace)
        const text = `Which race says this?`
        const correctText = `${correctRace} (${soundGroup.name})`
        const correctOption = options[correctIndex]
        const link = `${WOWHEAD_URL[wowexp]}sound=${soundGroup.id}`
        return {text, options, correctOption, correctText, optionsTexts, link, sound}
    }
}]

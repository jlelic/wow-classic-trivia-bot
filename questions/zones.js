import {formatOptions, randomIndex, selectRandom, shuffle} from '../utils'
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import {CLASS_OPTIONS, GENERAL_OPTIONS} from './options'
import sharp from 'sharp'
import {
    getWowheadRandomScreenshot,
    getWowheadScreenshots,
    getWowheadTable,
    WoWExpansion,
    WOWHEAD_URL
} from '../wowhead';

export const zones = []
export const zonesMap = {}
getWowheadTable(WoWExpansion.TBC, 'zones')
    .then(({data}) => data.forEach(zone => {
        if (zone.name === 'Caverns of Time'
            || zone.name === 'The Veiled Sea'
            || zone.name === 'Blackrock Spire'
            || zone.name === 'Onyxia\'s Lair'
            || zone.name === 'Deeprun Tram'
            || zone.name === 'Blackrock Mountain'
            || zone.name === 'Emerald Forest'
            || zone.name === 'Brian and Pat Test'
            || zone.name === 'REUSE'
            || zone.name === 'Karazhan *UNUSED*'
            || zone.name === 'Reuse Me'
            || zone.name === 'Reuse Me 7'
            || zone.name === 'Test Dungeon'
            || zone.name === 'Auchindoun'
            || zone.name === 'The North Sea'
            || zone.name === 'Twisting Nether'
        ) {
            return
        }
        zones.push(zone)
        zonesMap[zone.id] = zone
    }))

const getMapUrl = (wowexp, zoneId) => `https://wow.zamimg.com/images/wow/${wowexp}/maps/enus/zoom/${zoneId}.jpg`

export default [
    {
        expansions: [WoWExpansion.Classic, WoWExpansion.TBC],
        generator: async (wowexp) => {
            const options = GENERAL_OPTIONS
            const optionsZones = shuffle(zones)
                .filter(zone => ((zone.category === 8 && wowexp === WoWExpansion.TBC) || (zone.category <= 2 && wowexp === WoWExpansion.Classic))
                    && !zone.instance)
                .slice(0, GENERAL_OPTIONS.length)
            const zone = optionsZones[0]
            const correctText = zone.name
            const optionsTexts = shuffle(optionsZones.map(zone => zone.name))
            const correctIndex = optionsTexts.findIndex(zoneName => zoneName === correctText)
            const correctOption = options[correctIndex]
            const mapUrl = getMapUrl(wowexp, zone.id)
            const imgData = await fetch(mapUrl)
            const imgBlob = await imgData.arrayBuffer()
            const crop = {
                width: 100,
                height: 100,
                left: 250 + Math.trunc(Math.random() * 330),
                top: 120 + Math.trunc(Math.random() * 200)
            }
            console.log(`Cropping ${correctText} id ${zone.id}`)
            console.log(mapUrl)
            console.log(crop)
            const croppedImageBuffer = await sharp(new Buffer(imgBlob))
                .extract(crop)
                .jpeg()
                // .toFile('test.jpg')
                .toBuffer()
            const file = croppedImageBuffer

            const text = 'What zone is this?'

            const link = `${WOWHEAD_URL[wowexp]}zone=${zone.id}`
            return {text, options, correctOption, correctText, optionsTexts, link, file, spoilerImage: mapUrl}

        }
    },
    {
        expansions: [WoWExpansion.Classic, WoWExpansion.TBC],
        generator: async (wowexp) => {
            const options = GENERAL_OPTIONS
            const optionsZones = shuffle(zones)
                .filter(zone => (!zone.expansion && wowexp === WoWExpansion.Classic)
                    || (zone.expansion === 1 && wowexp === WoWExpansion.TBC))
                .slice(0, options.length)
            const zone = optionsZones[0]
            const correctText = zone.name
            console.log(`Getting screenshot of ${zone.id} ${zone.name}`)
            const image = await getWowheadRandomScreenshot(wowexp, `zone=${zone.id}`)
            const optionsTexts = shuffle(optionsZones.map(zone => zone.name))
            const correctIndex = optionsTexts.findIndex(zoneName => zoneName === correctText)
            const correctOption = options[correctIndex]
            const text = 'What zone is this?'
            const link = `${WOWHEAD_URL[wowexp]}zone=${zone.id}`
            return {text, options, correctOption, correctText, optionsTexts, link, image}

        }
    },
]

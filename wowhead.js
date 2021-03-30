import cheerio from 'cheerio'
import fetch from 'node-fetch'
import {selectRandom} from "./utils";

export const WoWExpansion = {
    Classic: 'classic',
    TBC: 'tbc',
}

export const WOWHEAD_URL =
    {
        classic: 'https://classic.wowhead.com/',
        tbc: 'https://tbc.wowhead.com/'
    }

export const getWowheadItemsTable = async (wowexp, query) => {
    const result = await fetch(`${WOWHEAD_URL[wowexp]}${query}`)
    const htmlText = await result.text()
    return eval(htmlText.match(/var listviewitems = [^;]+/)[0].slice(20))
}

export const getWowheadItemSetsTable = async (wowexp, query) => {
    const result = await fetch(`${WOWHEAD_URL[wowexp]}${query}`)
    const htmlText = await result.text()
    const matchedText = htmlText.match(/var itemSets[^;]+/)[0].slice(15)
    return eval(matchedText)
}

export const getWowheadSpellsTable = async (wowexp, query) => {
    const result = await fetch(`${WOWHEAD_URL[wowexp]}${query}`)
    const htmlText = await result.text()
    const regex = `WH.Gatherer.addData\\(6, ${WOWHEAD_URL[wowexp].includes('tbc') ? 5 : 4}, [^;]+`
    const matched = htmlText.match(regex)[0].slice(26, -1)
    const iconsTable = JSON.parse(matched)
    const spellsTable = eval(htmlText.match(/var listviewspells = [^;]+/)[0].slice(20))
    return {iconsTable, spellsTable}
}

export const getWowheadScreenshots = async (wowexp, query) => {
    const result = await fetch(`${WOWHEAD_URL[wowexp]}${query}`)
    const htmlText = await result.text()
    const matchedText = htmlText.match(/var lv_screenshots = [^;]+/)[0].slice(21)
    return eval(matchedText)
}

export const getWowheadRandomScreenshot = async (wowexp, query) => {
    const screenshots = await getWowheadScreenshots(wowexp, query)
    const screenshot = selectRandom(screenshots)
    return `https://wow.zamimg.com/uploads/screenshots/normal/${screenshot.id}.jpg`
}

class Listview {

    constructor(json) {
        this.json = json
    }

    getJson() {
        return this.json
    }
}

Listview.extraCols = {popularity: 0}

export const getWowheadTable = async (wowexp, query) => {
    const result = await fetch(`${WOWHEAD_URL[wowexp]}${query}`)
    const htmlText = await result.text()
    const matchedText = htmlText.match(/new Listview\([^\n]+/)[0]
    return eval(matchedText).getJson()
}

export const getMainScreenshotUrl = async (wowexp, query) => {
    const result = await fetch(`${WOWHEAD_URL[wowexp]}${query}`)
    const htmlText = await result.text()
    const $ = cheerio.load(htmlText)
    return $(`[property='og:image']`).attr().content
}


export const getWowheadSpecializations = async (wowexp) => {
    const WH = {
        data: {},
        setPageData: (key, value) => WH.data[key] = value
    }
    const result = await fetch(`${WOWHEAD_URL[wowexp]}data/global`)
    const script = await result.text()
    eval(script)
    return WH.data['WH.Wow.PlayerClass.Specialization.names']
}




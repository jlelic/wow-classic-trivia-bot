import FactionModel from '../models/faction'
import { findRandom } from '../db'
import { shuffle } from '../utils'
import { GENERAL_OPTIONS } from './options'

export default [
  async () => {
    const options = GENERAL_OPTIONS;
    const factions = shuffle(await findRandom(FactionModel, {}, 4))
    const correct = Math.floor(Math.random() * GENERAL_OPTIONS.length)
    let text = `Which faction fits the following description:\n*${factions[correct].descriptionCensored}*\n?`
    factions.forEach((faction, index) => {
      text += `\n ${options[index]} for **${faction.name}**`
    })
    const correctOption = options[correct]
    const correctText = factions[correct].name
    const link = factions[correct].url
    return { text, options, correctOption, correctText, link }
  }
]
import ItemModel from '../models/item'
import NpcModel from '../models/npc'
import { findOneRandom, findRandom } from '../db'
import { shuffle } from '../utils'
import { CLASS_OPTIONS, GENERAL_OPTIONS } from './options'
import { classes, classMapToDb } from '../enums'

export default [
  async () => {
    const options = GENERAL_OPTIONS
    const item = await findOneRandom(ItemModel, { droppedBy: { $ne: null } })
    const droppedBy = await findOneRandom(NpcModel, { id: item.droppedBy })
    let text = `Which boss drops **${item.name}**?`
    const optionsTextsSet = new Set([droppedBy.name])
    const bosses = await findRandom(NpcModel, { rank: 4 }, 4)
    for (let i = 1; i < bosses.length; i++) {
      optionsTextsSet.add(bosses[i].name)
      if (optionsTextsSet.size >= options.length) {
        break;
      }
    }
    const optionsTexts = shuffle([...optionsTextsSet])
    options.forEach((option, index) => {
      text += `\n ${option} for **${optionsTexts[index]}**`
    })
    const correctOption = options[optionsTexts.findIndex(t => t === droppedBy.name)]
    const correctText = droppedBy.name
    const link = `${encodeURIComponent(item.name)}#items`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = CLASS_OPTIONS
    const correct = Math.floor(Math.random() * classes.length)
    const item = await findOneRandom(ItemModel, { allowableClass: classMapToDb[correct] })
    let text = `**${item.name}** is specific for which class?`
    options.forEach((option, index) => {
      text += `\n ${option} for **${classes[index]}**`
    })
    const correctText = classes[correct]
    const correctOption = options[correct]
    const link = `${encodeURIComponent(item.name)}#items`
    return { text, options, correctOption, correctText, link }
  },
]
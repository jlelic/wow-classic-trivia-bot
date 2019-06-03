import NpcModel from '../models/npc'
import { findOneRandom, findRandom } from '../db'
import { shuffle } from '../utils'
import { GENERAL_OPTIONS, RARITY_OPTIONS, TRIBE_OPTIONS, YES_NO_OPTIONS } from './options'
import { ranks, tribes } from '../enums'

export default [
  async () => {
    const options = TRIBE_OPTIONS
    const tribe = Math.floor(Math.random() * options.length) + 1
    const npc = await findOneRandom(NpcModel, { tribe })
    let text = `What is the creature type of **${npc.name}**`
    options.forEach((option, index) => {
      text += `\n ${option} for ${tribes[index + 1]}`
    })
    const correctOption = options[tribe - 1]
    const correctText = tribes[tribe]
    const link = `${encodeURIComponent(npc.name)}#npcs`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = GENERAL_OPTIONS;
    const npcs = shuffle(await findRandom(NpcModel, { subname: { $ne: null } }, 50))
    const chosenOne = npcs[0];
    const optionsTextsSet = new Set([chosenOne.subname])
    for (let i = 1; i < npcs.length; i++) {
      optionsTextsSet.add(npcs[i].subname)
      if (optionsTextsSet.size >= options.length) {
        break;
      }
    }
    const optionsTexts = shuffle([...optionsTextsSet])
    let text = `What is the title of **${chosenOne.name}**`
    options.forEach((option, index) => {
      text += `\n ${option} for **${optionsTexts[index]}**`
    })
    const correctOption = options[optionsTexts.findIndex(t => t === chosenOne.subname)]
    const correctText = chosenOne.subname
    const link = `${encodeURIComponent(chosenOne.name)}#npcs`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = YES_NO_OPTIONS
    const correct = Math.floor(Math.random() * 2)
    const query = correct ? { class: 1 } : { class: { $ne: 1 } }
    const npc = await findOneRandom(NpcModel, query)
    let text = `Does **${npc.name}** have mana?`
    const correctOption = options[correct]
    const correctText = correct ? 'No' : 'Yes'
    const link = `${encodeURIComponent(npc.name)}#npcs`
    return { text, options, correctOption, correctText, link, time: 8 }
  },
  async () => {
    const options = RARITY_OPTIONS
    const rank = Math.floor(Math.random() * options.length)
    const npc = await findOneRandom(NpcModel, { rank })
    let text = `What is the classification **${npc.name}**`
    options.forEach((option, index) => {
      text += `\n ${option} for ${ranks[index]}`
    })
    const correctOption = options[rank]
    const correctText = ranks[rank]
    const link = `${encodeURIComponent(npc.name)}#npcs`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = YES_NO_OPTIONS
    const correct = Math.floor(Math.random() * 2)
    const query = correct ? { skinningId: 0 } : { skinningId: { $ne: 0 } }
    const npc = await findOneRandom(NpcModel, query)
    let text = `Is **${npc.name}** skinnable?`
    const correctOption = options[correct]
    const correctText = correct ? 'No' : 'Yes'
    const link = `${encodeURIComponent(npc.name)}#npcs`
    return { text, options, correctOption, correctText, link, time: 8 }
  },
]
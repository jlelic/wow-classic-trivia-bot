import TeleportModel from '../models/teleport'
import { findOneRandom, findRandom } from '../db'
import { shuffle } from '../utils'
import { YES_NO_OPTIONS, GENERAL_OPTIONS } from './options'
import { maps } from '../enums'

export default [
  async () => {
    const options = YES_NO_OPTIONS;
    const teleport1 = await findOneRandom(TeleportModel, {})
    const teleport2 = await findOneRandom(TeleportModel, {
      id: { $ne: teleport1.id },
      map: teleport1.map,
      $or: [
        { positionX: { $gt: teleport1.positionX + 300 } },
        { positionX: { $lt: teleport1.positionX - 300 } },
      ]
    })
    let text = `Is **${teleport1.name}** more to the **north** than **${teleport2.name}**?`
    const correct = teleport1.positionX > teleport2.positionX ? 0 : 1
    const correctOption = YES_NO_OPTIONS[correct]
    const correctText = correct ? 'No' : 'Yes'
    const link = `https://wow.gamepedia.com/index.php?search=${encodeURIComponent(teleport1.name)}\nhttps://wow.gamepedia.com/index.php?search=${encodeURIComponent(teleport2.name)}`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = GENERAL_OPTIONS.slice(0, 3);
    const chosenOne = await findOneRandom(TeleportModel, {})
    const otherTeleports = await findRandom(TeleportModel, { map: { $ne: chosenOne.map } }, 2)
    let text = `Which of these locations is on a different continent than the other 2?`
    const teleports = shuffle([chosenOne, ...otherTeleports])
    teleports.forEach((teleport, index) => {
      text += `\n ${options[index]} for **${teleport.name}**`
    })
    const correctOption = options[teleports.findIndex(t => t === chosenOne)]
    const correctText = ' ** \n' + teleports.map(teleport => `**${teleport.name}** - **${maps[teleport.map]}**`).join('\n') + ' ** '
    const link = `https://wow.gamepedia.com/index.php?search=${encodeURIComponent(chosenOne.name)}`
    return { text, options, correctOption, correctText, link }
  }
]
import AbilityModel from '../models/ability'
import { findOneRandom, findRandom } from '../db'
import { shuffle } from '../utils'
import { GENERAL_OPTIONS, YES_NO_OPTIONS } from './options'

export default [
  async () => {
    const options = GENERAL_OPTIONS;
    const chosenOne = await findOneRandom(AbilityModel,
      {
        description: { $ne: null }
      })
    const abilities = shuffle(await findRandom(AbilityModel,
      {
        description: { $ne: null },
        school: chosenOne.school
      }, 50))
    const optionsTextsSet = new Set([chosenOne.name])
    for (let i = 0; i < abilities.length; i++) {
      if (abilities[i].description === chosenOne.description) {
        continue
      }
      optionsTextsSet.add(abilities[i].name)
      if (optionsTextsSet.size >= options.length) {
        break;
      }
    }
    const optionsTexts = shuffle([...optionsTextsSet])
    let text = `What is the name of the ability with following description:\n*${chosenOne.description}*\n?`
    options.forEach((option, index) => {
      text += `\n ${option} for **${optionsTexts[index]}**`
    })
    const correctOption = options[optionsTexts.findIndex(t => t === chosenOne.name)]
    const correctText = chosenOne.name
    const link = chosenOne.url
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = GENERAL_OPTIONS;
    const chosenOne = await findOneRandom(AbilityModel,
      {
        imageUrl: { $ne: null }
      })
    const abilities = shuffle(await findRandom(AbilityModel,
      {
        imageUrl: { $ne: null },
        school: chosenOne.school
      }, 50))
    const optionsTextsSet = new Set([chosenOne.name])
    for (let i = 0; i < abilities.length; i++) {
      if (abilities[i].imageUrl === chosenOne.imageUrl) {
        continue
      }
      optionsTextsSet.add(abilities[i].name)
      if (optionsTextsSet.size >= options.length) {
        break;
      }
    }
    const optionsTexts = shuffle([...optionsTextsSet])
    let text = `What is the name of the ability with this icon?`
    let file = chosenOne.imageUrl
    options.forEach((option, index) => {
      text += `\n ${option} for **${optionsTexts[index]}**`
    })
    const correctOption = options[optionsTexts.findIndex(t => t === chosenOne.name)]
    const correctText = chosenOne.name
    const link = chosenOne.url
    return { text, options, correctOption, correctText, link, file }
  },
  async () => {
    const options = YES_NO_OPTIONS;
    const ability1 = await findOneRandom(AbilityModel,
      {
        level: { $ne: 0 },
        $or: [{ subname: 'Rank 1' }, { subname: '' }]
      })
    const ability2 = await findOneRandom(AbilityModel,
      {
        $and: [
          { level: { $ne: 0 } },
          { level: { $ne: ability1.level } }
        ],
        $or: [{ subname: 'Rank 1' }, { subname: '' }]
      })
    let text = `Can you get **${ability1.name}** at an earlier level than **${ability2.name}**?`
    const correct = ability1.level < ability2.level ? 0 : 1
    const correctOption = YES_NO_OPTIONS[correct]
    const correctText = ` **You can get ${ability1.name} at level **${ability1.level}** and ${ability2.name} at level **${ability2.level}**!** `
    const link = `${ability1.url}\n${ability2.url}`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = YES_NO_OPTIONS;
    const ability1 = await findOneRandom(AbilityModel,
      {
        $and: [
          { range: { $gt: 10 } },
        ],
        class: { $ne: 0 }
      })
    const ability2 = await findOneRandom(AbilityModel,
      {
        $and: [
          { range: { $gt: 10 } },
          { range: { $ne: ability1.range } }
        ],
        class: { $ne: 0 }
      })
    let text = `Does **${ability1.name}${ability1.subname ? ` ${ability1.subname}` : ''}** have a bigger range than **${ability2.name}${ability2.subname ? ` ${ability2.subname}` : ''}**?`
    const correct = ability1.range > ability2.range ? 0 : 1
    const correctOption = YES_NO_OPTIONS[correct]
    const correctText = ` ** ${ability1.name}${ability1.subname ? ` ${ability1.subname}` : ''}has range **${ability1.range} yd** and ${ability2.name}${ability2.subname ? ` ${ability2.subname}` : ''} has **${ability2.range} yd**!** `
    const link = `${ability1.url}\n${ability2.url}`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = YES_NO_OPTIONS;
    const ability1 = await findOneRandom(AbilityModel,
      {
        $and: [
          { castTime: { $gt: 0 } },
        ],
        class: { $ne: 0 }
      })
    const ability2 = await findOneRandom(AbilityModel,
      {
        $and: [
          { castTime: { $gt: 0 } },
          { castTime: { $ne: ability1.castTime } }
        ],
        class: { $ne: 0 }
      })
    let text = `Does **${ability1.name}${ability1.subname ? ` ${ability1.subname}` : ''}** have a longer cast time than **${ability2.name}${ability2.subname ? ` ${ability2.subname}` : ''}**?`
    const correct = ability1.castTime > ability2.castTime ? 0 : 1
    const correctOption = YES_NO_OPTIONS[correct]
    const correctText = ` ** ${ability1.name}${ability1.subname ? ` ${ability1.subname}` : ''} has cast time **${ability1.castTime} s** and ${ability2.name}${ability2.subname ? ` ${ability2.subname}` : ''} has **${ability2.castTime} s**!** `
    const link = `${ability1.url}\n${ability2.url}`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = YES_NO_OPTIONS;
    const ability1 = await findOneRandom(AbilityModel,
      {
        $and: [
          { cooldown: { $gt: 0 } },
        ],
        class: { $ne: 0 }
      })
    const ability2 = await findOneRandom(AbilityModel,
      {
        $and: [
          { cooldown: { $gt: 0 } },
          { cooldown: { $ne: ability1.cooldown } }
        ],
        class: { $ne: 0 }
      })
    let text = `Does **${ability1.name}${ability1.subname ? ` ${ability1.subname}` : ''}** have a longer cooldown than **${ability2.name}${ability2.subname ? ` ${ability2.subname}` : ''}**?`
    const correct = ability1.cooldown > ability2.cooldown ? 0 : 1
    const correctOption = YES_NO_OPTIONS[correct]
    const correctText = ` ** ${ability1.name}${ability1.subname ? ` ${ability1.subname}` : ''} has **${ability1.cooldown} s** cooldown and ${ability2.name}${ability2.subname ? ` ${ability2.subname}` : ''} has **${ability2.cooldown} s**!** `
    const link = `${ability1.url}\n${ability2.url}`
    return { text, options, correctOption, correctText, link }
  },
]
import TalentModel from '../models/talent'
import { findOneRandom, findRandom } from '../db'
import { shuffle } from '../utils'
import { GENERAL_OPTIONS } from './options'
import { talentPercentages } from '../enums'

export default [
  async () => {
    const options = GENERAL_OPTIONS;
    const chosenOne = await findOneRandom(TalentModel,
      { name: { '$regex': '^((?!Improved).)*$', '$options': 'i' } }
    )
    const talents = shuffle(await findRandom(TalentModel,
      {
        $and: [
          { name: { '$regex': '^((?!Improved).)*$', '$options': 'i' } },
          { name: { $ne: chosenOne.name } }
        ],
        specialization: chosenOne.specialization
      }, 50))
    const optionsTextsSet = new Set([chosenOne.name])
    for (let i = 0; i < talents.length; i++) {
      if (talents[i].description === chosenOne.description) {
        continue
      }
      optionsTextsSet.add(talents[i].name)
      if (optionsTextsSet.size >= options.length) {
        break;
      }
    }
    const optionsTexts = shuffle([...optionsTextsSet])
    let text = `What is the name of the talent with following description:\n*${chosenOne.description}*\n?`
    options.forEach((option, index) => {
      text += `\n ${option} for **${optionsTexts[index]}**`
    })
    const correctOption = options[optionsTexts.findIndex(t => t === chosenOne.name)]
    const correctText = `${chosenOne.name}${chosenOne.subname ? ` ${chosenOne.subname}` : ''}`
    const link = chosenOne.url
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = GENERAL_OPTIONS;
    const chosenOne = await findOneRandom(TalentModel,
      {
        imageUrl: { $ne: null },
        name: { '$regex': '^((?!Improved).)*$', '$options': 'i' }
      })
    const talents = shuffle(await findRandom(TalentModel,
      {
        imageUrl: { $ne: null },
        specialization: chosenOne.specialization,
        name: { '$regex': '^((?!Improved).)*$', '$options': 'i' }
      }, 50))
    const optionsTextsSet = new Set([chosenOne.name])
    for (let i = 0; i < talents.length; i++) {
      if (talents[i].imageUrl === chosenOne.imageUrl) {
        continue
      }
      optionsTextsSet.add(talents[i].name)
      if (optionsTextsSet.size >= options.length) {
        break;
      }
    }
    const optionsTexts = shuffle([...optionsTextsSet])
    let text = `What is the name of the talent with this icon?`
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
    const options = GENERAL_OPTIONS;
    const correct = Math.floor(Math.random() * options.length)
    const rank = Math.floor(Math.random() * 5) + 1
    const percentages = talentPercentages[rank - 1]
    const startOptionIndex = Math.floor(Math.random() * (percentages.length - options.length))
    const optionsPercentages = percentages.slice(startOptionIndex, startOptionIndex + options.length)
    const correctPercentage = optionsPercentages[correct]
    const talent = await findOneRandom(TalentModel, {
      subname: `Rank ${rank}`,
      description: { $regex: `${correctPercentage}%` }
    })
    const descriptionCensored = talent.description.replace(correctPercentage.toString(), '**X**')
    let text = `What's the value of **X** in this description of **${talent.name} ${talent.subname}**:\n*${descriptionCensored}*\n?`
    options.forEach((option, index) => {
      text += `\n ${option} for **${optionsPercentages[index]}%**`
    })
    const correctOption = options[correct]
    const correctText = correctPercentage
    const link = talent.url
    return { text, options, correctOption, correctText, link, time: 16 }
  }
]
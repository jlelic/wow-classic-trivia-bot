import abilitiesQuestions from '../questions/abilities'
import factionsQuestions from '../questions/factions'
import itemsQuestions from '../questions/items'
import locationsQuestions from '../questions/locations'
import npcsQuestions from '../questions/npcs'
import talentsQuestions from '../questions/talents'
import { flatten, shuffle } from '../utils'

const categoryQuestions = {
  abilities: abilitiesQuestions,
  factions: factionsQuestions,
  items: itemsQuestions,
  locations: locationsQuestions,
  npcs: npcsQuestions,
  talentsQuestions: talentsQuestions
}

// Array​.prototype​.flat doesn't work on node?
const allQuestions = flatten(Object.values(categoryQuestions))

export const getCategories = () => Object.keys(categoryQuestions)

export const getOneQuestion = () => [shuffle(allQuestions)[0]]

export const getCategoryQuestion = (category) => [shuffle(categoryQuestions[category])[0]]

export const getLimitedQuestionsRandomized = (n) => shuffle(allQuestions).slice(0, n)

export const getAllQuestionsRandomized = () => shuffle(allQuestions)


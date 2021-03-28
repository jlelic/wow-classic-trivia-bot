import abilitiesQuestions from '../questions/abilities'
import npcsQuestions from '../questions/npcs'
import itemsQuestions from './items'
import soundsQuestions from './sounds'
import zonesQuestions from './zones'
import professionsQuestions from './professions'
import {flatten, selectRandom, shuffle} from '../utils'

const categoryQuestions = {
    items: itemsQuestions,
    sounds: soundsQuestions,
    abilities: abilitiesQuestions,
    // factions: factionsQuestions,
    npcs: npcsQuestions,
    professions: professionsQuestions,
    zones: zonesQuestions,
    // talents: talentsQuestions
}

// Array​.prototype​.flat doesn't work on node?
const allQuestions = flatten(Object.values(categoryQuestions))

const filterByExpansion = (wowexp, questions) => questions.filter(question => !question.expansions || question.expansions.includes(wowexp))

export const getCategories = () => Object.keys(categoryQuestions)

export const getOneQuestion = (wowexp) => [shuffle(filterByExpansion(wowexp, allQuestions))[0]]

export const getUniqueCategoryQuestions = (wowexp, category, n) => {
    return filterByExpansion(wowexp, categoryQuestions[category]).slice(0, n)
}

export const getCategoryQuestions = (wowexp, category, n) => {
    const questions = []
    do {
        questions.push(selectRandom(filterByExpansion(wowexp, categoryQuestions[category])))
    } while (questions.length < n)
    return questions
}

export const getNQuestions = (wowexp, n) => {
    const validQuestions = filterByExpansion(wowexp, allQuestions)
    const result = []
    let i = 0
    shuffle(validQuestions)
    do {
        result.push(validQuestions[i])
        i++
        if(i === validQuestions.length) {
            i = 0
            shuffle(validQuestions)
        }
    } while(result.length < n)
    return result
}

export const getAllQuestions = (wowexp) => shuffle(filterByExpansion(wowexp, allQuestions))


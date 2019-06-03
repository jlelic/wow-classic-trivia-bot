import Discord from 'discord.js'
import { asyncForEach, selectRandom, sleep } from './utils'
import { getCategories, getCategoryQuestions } from './questions/index'
import TriviaGame from './game'

const DEFAULT_TIME_FOR_QUESTION = 12


export default class BattleRoyale extends TriviaGame {

  constructor() {
    super()
    this.playerIds = []
  }

  async play(channel, playerIds) {
    if (this.round > 0) {
      channel.send(`Sorry, I'm busy with a game already in progress in <#${this.gameChannel.id}>`)
      return
    }
    this.playerIds = [...new Set(playerIds)]
    this.gameChannel = channel

    channel.send(`Paging ${this.playerIds.map(id => `<@${id}>`).join(', ')}\nThe WoW Classic Trivia Battle Royale begins in:`)
    const initialCountdownMessage = await this.gameChannel.send(10)
    await this.countdownMessage(initialCountdownMessage, 10)

    this.round = 1
    this.scores = {}
    const categories = getCategories()
    do {
      const category = selectRandom(categories)
      await this.gameChannel.send(`-- Round ${this.round}, category ${category} --\nPlayers remaining:  ${this.playerIds.map(id => `<@${id}>`).join(', ')}`)
      const question = getCategoryQuestions(category, 1)[0]
      const eliminated = new Set()
      await asyncForEach(this.playerIds, async (playerId) => {
        const { text, options, correctOption, correctText, link, file, time } = await question()
        const httpLink = link.startsWith('http') ? link : `https://classic.wowhead.com/search?q=${link}`
        const questionMessage = await this.gameChannel.send(`Question for <@${playerId}>\n${text}`, { file })
        let timeLeft = time || DEFAULT_TIME_FOR_QUESTION
        const timerMessage = await this.gameChannel.send(timeLeft)
        await asyncForEach(options, option => questionMessage.react(option))
        await sleep(options.length * 600)
        const answeredCorrectly = await this.collectAnswer(questionMessage, playerId, correctOption, timerMessage, timeLeft)
        await this.gameChannel.send(`The correct answer was: ${correctOption} - **${correctText}**\n${httpLink}`)
        if (answeredCorrectly) {
          await this.gameChannel.send(`You've answered correctly, good job!`)
        } else {
          await this.gameChannel.send(`You didn't answer correctly, you're about to be eliminated!`)
          eliminated.add(playerId)
        }
      })
      if (this.playerIds.length === eliminated.size) {
        await this.gameChannel.send('No one guessed correctly, no one is eliminated!')
        this.playerIds = [...eliminated]
      } else {
        this.playerIds = this.playerIds.filter(id => !eliminated.has(id))
        await asyncForEach([...eliminated], async (id) => {
          await this.gameChannel.send(`💀 <@${id}> was eliminated!`)
        })
      }
      this.round++
    } while (this.playerIds.length > 1)
    if (this.playerIds.length == 1) {
      await this.gameChannel.send(`⭐⭐⭐ Congratulations <@${this.playerIds[0]}> to your Victory Royale ⭐⭐⭐`)
    } else {
      await this.gameChannel.send('The game has ended without any winners!')
    }
    this.round = 0
  }

  async collectAnswer(question, playerId, correct, timer, timeLeft) {
    return new Promise((resolve) => {
      this.countdownMessage(timer, timeLeft)
      const collector = question.createReactionCollector(x => true)
      collector.on('collect', reaction => {
        [...reaction.users.values()].forEach((user) => {
          if (user.id == playerId) {
            resolve(reaction.emoji.name == correct)
          }
        })
      })
      setTimeout(() => resolve(false), timeLeft * 1000)
    })
  }

  async answeredCorrectly(question, correct, playerId) {
    let answered = false
    let result = false
    await asyncForEach([...question.reactions.values()], async reaction => {
      console.log(reaction.emoji.name)
      const isCorrect = reaction.emoji.name === correct
      if (reaction.users.size === 1) {
        return;
      }
      [...reaction.users.values()].forEach((user) => {
        if (user.id == playerId) {
          if (answered) {
            result = false
            return
          }
          answered = true
          if (isCorrect) {
            result = true
          }
        }
      })
    })
    return result
  }
}
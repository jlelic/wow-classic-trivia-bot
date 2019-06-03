import { asyncForEach, sleep } from './utils'

const DEFAULT_TIME_FOR_QUESTION = 12


export default class TriviaGame {

  constructor() {
    this.scores = {}
    this.round = 0
  }

  async play(channel, questions) {
    if(this.round > 0) {
      channel.send(`Sorry, I'm busy with a game already in progress in <#${this.gameChannel.id}>`)
      return
    }

    this.gameChannel = channel
    this.round = 1
    this.scores = {}
    do {
      const { text, options, correctOption, correctText, link, file, time } = await questions[this.round - 1]()
      const httpLink = link.startsWith('http') ? link : `https://classic.wowhead.com/search?q=${link}`
      const questionMessage = await this.gameChannel.send(`-- Round ${this.round}/${questions.length} --\n${text}`, { file })
      let timeLeft = time || DEFAULT_TIME_FOR_QUESTION
      const timerMessage = await this.gameChannel.send(timeLeft)
      asyncForEach(options, option => questionMessage.react(option))
      await sleep(options.length * 600)
      await this.countdownMessage(timerMessage, timeLeft)
      const resultMessage = await this.gameChannel.send(`Round's over, the correct answer was: ${correctOption} - **${correctText}**\n${httpLink}`)
      await this.updateScores(questionMessage, correctOption)
      this.round++
    } while (this.round <= questions.length)
    await this.gameChannel.send('Game over!')
    await this.gameChannel.send(this.parseScore(this.scores) || 'No results!')
    this.round = 0
  }

  async countdownMessage(timerMessage, timeLeft) {
    for (let i = timeLeft; i >= 0; i--) {
      await timerMessage.edit(i)
      await sleep(1000)
    }
  }

  parseScore(scores) {
    return Object.entries(scores)
      .sort(([id1, score1], [id2, score2]) => score2 - score1)
      .map(([id, score], index) => `${index + 1}. <@${id}> \t ${score}`)
      .join('\n')
  }

  async updateScores(question, correct) {
    const voted = new Set()
    const updates = {}
    await asyncForEach([...question.reactions.values()], async reaction => {
      let scoreDiff = reaction.emoji.name === correct ? 1 : 0
      if (reaction.users.size === 1) {
        return;
      }
      [...reaction.users.values()].forEach((user, index) => {
        if (!user.bot) {
          if (voted.has(user.id)) {
            updates[user.id] = -1
          }
          voted.add(user.id)
          updates[user.id] = (updates[user.id] || 0) + scoreDiff
          if(index === 1 && scoreDiff) {
            updates[user.id] += 0.5
          }
        }
      });
    });
    const updateText = Object.entries(updates).map(([playerId, score]) => {
      this.scores[playerId] = (this.scores[playerId] || 0) + score
      return `<@${playerId}> ${score > 0 ? '+' : ''}${score}`
    })
      .join(', ')
    await this.gameChannel.send(`Score updates: ${updateText}`)
  }
}
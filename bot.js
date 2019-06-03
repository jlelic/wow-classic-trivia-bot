const Discord = require('discord.js')
const fs = require('fs')
import { connect } from './db'
import {
  getAllQuestions, getCategories, getCategoryQuestions,
  getLimitedQuestions, getOneQuestion
} from './questions/index'
import TriviaGame from './game'

const token = process.env.DISCORD_BOT_TOKEN || require('./bot-token')
if (!token) {
  throw 'Missing discord bot token!'
}

let game
const categories = getCategories()
const client = new Discord.Client()
client.on('error', (err) => {
  console.log('Discord.js error:', err)
})

client.on('ready', async () => {
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

  try {
    await connect()
  } catch (e) {
    console.log('Database error:', e)
    exit()
  }
  game = new TriviaGame()
})

client.on('message', async (message) => {
  if (!message.content.toLowerCase().startsWith('test ')) {
    return
  }

  const params = message.content.split(' ')
  let replyText = 'Unknown command, use `test help` for help'
  switch (params[1]) {
    case 'me':
      const [_, __, numStr, category] = params
      const num = +numStr
      if (numStr && typeof (num) !== 'number') {
        message.channel.send(`Invalid number value ${numStr}`)
        return
      }
      if (category) {
        if (!categories.includes(category)) {
          message.channel.send(`Unknown category ${category}`)
          return
        }
        game.play(message.channel, getCategoryQuestions(category, num))
        return
      }
      game.play(message.channel, getLimitedQuestions(num || 10))
      return
    case 'quick':
      game.play(message.channel, getOneQuestion())
      return
    case 'final':
      game.play(message.channel, getAllQuestions())
      return
    case 'help':
      replyText = `Supported commands:
      \`me\` - test with 10 questions from random categories
      \`me X\` - test with X questions from random categories
      \`me X C\` - test with X questions from category C
      \`quick\` - test with 1 question
      \`final\` - test with all questions
      \`categories\` - lists categories
      `
      break
    case 'categories':
      replyText = categories.map(x => '`' + x + '`').join(', ')
      break
  }
  message.channel.send(replyText)
})

const exit = async () => {
  await client.destroy()
  process.exit(0)
}

client.login(token)

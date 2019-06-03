const Discord = require('discord.js')
const fs = require('fs')
import { connect } from './db'
import { getAllQuestionsRandomized } from './questions/index'
import TriviaGame from './game'

const CHANNEL_NAME = 'kai_wow_trivia'
const token = process.env.DISCORD_BOT_TOKEN || require('./bot-token')

let game
let gameChannel

const client = new Discord.Client()
client.on('error', (err) => {
  console.log('Discord.js error:', err)
})

if (!token) {
  throw 'Missing discord bot token!'
}

const config = { token }

client.on('ready', async () => {
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

  [...client.channels.entries()].forEach(async ([_, channel]) => {
    if (channel.name == CHANNEL_NAME) {
      gameChannel = channel
      game = new TriviaGame(channel)
    }
  })

  try {
    await connect()
  } catch (e) {
    console.log('Database error:', e)
    exit()
  }
})

let round = 0
client.on('message', async (message) => {
  if (message.content.toLowerCase().startsWith('test me')) {
    if (game.round > 0) {
      message.channel.send(`A game is already in progress in <#${gameChannel.id}>`)
      return
    }
    // if (message.channel.id != gameChannel.id) {
    //   message.channel.send(`You can only play the game in <#${gameChannel.id}>`)
    //   return
    // }
    game.gameChannel = message.channel
    game.play(getAllQuestionsRandomized())
    return
  }

})

const exit = async () => {
  await client.destroy()
  process.exit(0)
}

client.login(config.token)

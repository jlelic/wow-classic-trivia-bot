const Discord = require('discord.js')
const fs = require('fs')
const mongoose = require('mongoose')
const NpcModel = require('./models/npc')
const ItemModel = require('./models/item')

const DATABASE_URI = process.env.MONGODB_URI || 'mongodb://localhost/wowdb'
const CHANNEL_NAME = 'kai_bot_developers'
const token = process.env.DISCORD_BOT_TOKEN || require('./bot-token')
let gameChannel

const client = new Discord.Client()
client.on('error', (err) => {
  console.error('Discord.js error:')
  console.error(err)
})

if (!token) {
  throw 'Missing discord bot token!'
}

const config = {
  token
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

client.on('ready', async () => {
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

  [...client.channels.entries()].forEach(async ([_, channel]) => {
    if (channel.name == CHANNEL_NAME) {
      gameChannel = channel
    }
  })


  mongoose.connect(DATABASE_URI, async (err) => {
    if (err) {
      console.error(err)
      gameChannel.send(err)
      await exit()
    }
    console.log('Connected to database!')
  })
})


let playing = false
let round = 0
let scores
client.on('message', async (message) => {
  if (message.content.toLowerCase().startsWith('test me')) {
    if (round > 0) {
      message.channel.send(`A game is already in progress in <#${gameChannel.id}>`)
      return
    }
    if (message.channel.id != gameChannel.id) {
      message.channel.send(`You can only play the game in <#${gameChannel.id}>`)
      return
    }
    gameChannel = message.channel
    round = 1
    play()
    return
  }

})

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const findRandomNpc = (query) => new Promise((resolve, reject) => {
  NpcModel.findOneRandom(query, function(err, randomNpc) { // does't work with promises :(
    if (err) {
      reject(err)
      return
    }
    resolve(randomNpc)
  })
})

const findRandomNpcs = (query, limit) => new Promise((resolve, reject) => {
  NpcModel.findRandom(query, {}, { limit }, function(err, randomNpcs) { // does't work with promises :(
    if (err) {
      reject(err)
      return;
    }
    resolve(randomNpcs)
  })
})

const tribes = {
  1: 'Beast',
  2: 'Dragonkin',
  3: 'Demon',
  4: 'Elemental',
  5: 'Giant',
  6: 'Undead',
  7: 'Humanoid',
  8: 'Critter',
  9: 'Mechanical',
  10: 'Unspecified',
  12: 'Totem',
}

const ranks = {
  0: 'Normal',
  1: 'Rare',
  2: 'Elite',
  3: 'Rare Elite',
  4: 'Boss',
}

const questions = [
  async () => {
    const options = ['🐺', '🐲', '👺', '🔥', '🐘', '💀', '👨', '🐭', '🤖', '❌']
    const tribe = Math.floor(Math.random() * options.length) + 1
    const npc = await findRandomNpc({ tribe })
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
    const options = ['❤', '💙', '💚', '💛']
    const npcs = await findRandomNpcs({ subname: { $ne: null } }, 50)
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
      text += `\n ${option} for ${optionsTexts[index]}`
    })
    const correctOption = options[optionsTexts.findIndex(t => t === chosenOne.subname)]
    const correctText = chosenOne.subname
    const link = `${encodeURIComponent(chosenOne.name)}#npcs`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = ['✅', '⛔']
    const correct = Math.floor(Math.random() * 2)
    const query = correct ? { class: 1 } : { class: { $ne: 1 } }
    const npc = await findRandomNpc(query)
    let text = `Does **${npc.name}** have mana?`
    const correctOption = options[correct]
    const correctText = correct ? 'No' : 'Yes'
    const link = `${encodeURIComponent(npc.name)}#npcs`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = ['🐁','💍','💪','🤑','💀']
    const rank = Math.floor(Math.random() * options.length)
    const npc = await findRandomNpc({ rank })
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
    const options = ['✅', '⛔']
    const correct = Math.floor(Math.random() * 2)
    const query = correct ? { skinningId: 0 } : { skinningId: { $ne: 0 } }
    const npc = await findRandomNpc(query)
    let text = `Is **${npc.name}** skinnable?`
    const correctOption = options[correct]
    const correctText = correct ? 'No' : 'Yes'
    const link = `${encodeURIComponent(npc.name)}#npcs`
    return { text, options, correctOption, correctText, link }
  }
]
const TIME_FOR_QUESTION = 15
const TOTAL_ROUNDS = questions.length

const play = async () => {
  round = 1
  scores = {}
  do {
    const { text, options, correctOption, correctText, link } = await questions[round - 1]()
    const questionMessage = await gameChannel.send(text)
    asyncForEach(options, option => questionMessage.react(option))
    await sleep(options.length * 600)
    await questionMessage.edit(`-- Round ${round}/${TOTAL_ROUNDS} --\n${text}\nYou have ${TIME_FOR_QUESTION} seconds to answer`)
    await sleep(TIME_FOR_QUESTION * 1000)
    const resultMessage = await gameChannel.send(`Round's over, the correct answer was: ${correctOption} - ${correctText}\nhttps://classic.wowhead.com/search?q=${link}`)
    await updateScores(questionMessage, correctOption)
    round++
  } while (round <= TOTAL_ROUNDS)
  await gameChannel.send('Game over!')
  await gameChannel.send(parseScore() || 'No results!')
  round = 0
}

const parseScore = () => {
  return Object.entries(scores)
    .sort(([id1, score1], [id2, score2]) => score2 - score1)
    .map(([id, score], index) => `${index + 1}. <@${id}> \t ${score}`)
    .join('\n')
}

const updateScores = async (question, correct) => {
  await asyncForEach([...question.reactions.values()], async reaction => {
    if (reaction.users.size === 1) {
      return;
    }
    [...reaction.users.values()].forEach(user => {
      if (!user.bot) {
        let scoreDiff = reaction.emoji.name === correct ? 1 : -1;
        scores[user.id] = (scores[user.id] || 0) + scoreDiff;
      }
    });
  });
}

const exit = async () => {
  await client.destroy()
  process.exit(0)
}

client.login(config.token)

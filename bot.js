const Discord = require('discord.js')
const fs = require('fs')
const mongoose = require('mongoose')
const NpcModel = require('./models/npc')
const ItemModel = require('./models/item')
const AbilityModel = require('./models/ability')
const FactionModel = require('./models/faction')

const DATABASE_URI = process.env.MONGODB_URI || 'mongodb://localhost/wowdb'
const CHANNEL_NAME = 'kai_wow_trivia'
const GENERAL_OPTIONS = ['❤', '💙', '💚', '💛']
const YES_NO_OPTIONS = ['✅', '⛔']
const CLASS_OPTIONS = ['⚔', '🔨', '🏹', '🌩', '🐻', '🗡', '🔥', '👿', '✝']
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
    // if (message.channel.id != gameChannel.id) {
    //   message.channel.send(`You can only play the game in <#${gameChannel.id}>`)
    //   return
    // }
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

const findRandomItem = (query) => new Promise((resolve, reject) => {
  ItemModel.findOneRandom(query, async function(err, item) { // does't work with promises :(
    if (err) {
      reject(err)
      return
    }
    const droppedBy = await NpcModel.findOne({ id: item.droppedBy })
    resolve({ item, droppedBy })
  })
})

const findRandomAbility = (query) => new Promise((resolve, reject) => {
  AbilityModel.findOneRandom(query, async function(err, ability) { // does't work with promises :(
    if (err) {
      reject(err)
      return
    }
    resolve(ability)
  })
})

const findRandomAbilities = (query, limit) => new Promise((resolve, reject) => {
  AbilityModel.findRandom(query, {}, { limit }, function(err, ability) { // does't work with promises :(
    if (err) {
      reject(err)
      return;
    }
    resolve(ability)
  })
})

const findRandomFactions = (query, limit) => new Promise((resolve, reject) => {
  FactionModel.findRandom(query, {}, { limit }, function(err, factions) { // does't work with promises :(
    if (err) {
      reject(err)
      return;
    }
    resolve(factions)
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

const classMapToDb = [1, 2, 4, 64, 1024, 8, 128, 256, 16]
const classMapToId = {}
classMapToDb.forEach((db, i) => classMapToId[db] = i)
const classes = [
  'Warrior',
  'Paladin',
  'Hunter',
  'Shaman',
  'Druid',
  'Rogue',
  'Mage',
  'Warlock',
  'Priest'
]

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
    const options = GENERAL_OPTIONS;
    const npcs = shuffle(await findRandomNpcs({ subname: { $ne: null } }, 50))
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
      text += `\n ${option} for **${optionsTexts[index]}**`
    })
    const correctOption = options[optionsTexts.findIndex(t => t === chosenOne.subname)]
    const correctText = chosenOne.subname
    const link = `${encodeURIComponent(chosenOne.name)}#npcs`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = YES_NO_OPTIONS
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
    const options = ['🐁', '💍', '💪', '🤑', '💀']
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
    const options = YES_NO_OPTIONS
    const correct = Math.floor(Math.random() * 2)
    const query = correct ? { skinningId: 0 } : { skinningId: { $ne: 0 } }
    const npc = await findRandomNpc(query)
    let text = `Is **${npc.name}** skinnable?`
    const correctOption = options[correct]
    const correctText = correct ? 'No' : 'Yes'
    const link = `${encodeURIComponent(npc.name)}#npcs`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = GENERAL_OPTIONS
    const { item, droppedBy } = await findRandomItem({ droppedBy: { $ne: null } })
    let text = `Which boss drops **${item.name}**?`
    const optionsTextsSet = new Set([droppedBy.name])
    const bosses = await findRandomNpcs({ rank: 4 }, 4)
    for (let i = 1; i < bosses.length; i++) {
      optionsTextsSet.add(bosses[i].name)
      if (optionsTextsSet.size >= options.length) {
        break;
      }
    }
    const optionsTexts = shuffle([...optionsTextsSet])
    options.forEach((option, index) => {
      text += `\n ${option} for **${optionsTexts[index]}**`
    })
    const correctOption = options[optionsTexts.findIndex(t => t === droppedBy.name)]
    const correctText = droppedBy.name
    const link = `${encodeURIComponent(item.name)}#items`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = CLASS_OPTIONS
    const correct = Math.floor(Math.random() * classes.length)
    const { item } = await findRandomItem({ allowableClass: classMapToDb[correct] })
    let text = `**${item.name}** is specific for which class?`
    options.forEach((option, index) => {
      text += `\n ${option} for **${classes[index]}**`
    })
    const correctText = classes[correct]
    const correctOption = options[correct]
    const link = `${encodeURIComponent(item.name)}#items`
    return { text, options, correctOption, correctText, link }
  },
  async () => {
    const options = GENERAL_OPTIONS;
    const chosenOne = await findRandomAbility(
      {
        description: { $ne: null }
      })
    const abilities = shuffle(await findRandomAbilities(
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
    const chosenOne = await findRandomAbility(
      {
        imageUrl: { $ne: null }
      })
    const abilities = shuffle(await findRandomAbilities(
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
    const ability1 = await findRandomAbility({
      $or: [{ subname: 'Rank 1' }, { subname: '' }]
    })
    const ability2 = await findRandomAbility({
      level: { $ne: ability1.level },
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
    const ability1 = await findRandomAbility({
      $and: [
        { range: { $gt: 10 } },
      ],
      class: { $ne: 0 }
    })
    const ability2 = await findRandomAbility({
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
    const ability1 = await findRandomAbility({
      $and: [
        { castTime: { $gt: 0 } },
      ],
      class: { $ne: 0 }
    })
    const ability2 = await findRandomAbility({
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
    const options = GENERAL_OPTIONS;
    const factions = shuffle(await findRandomFactions({}, 4))
    const correct = Math.floor(Math.random() * GENERAL_OPTIONS.length)
    let text = `Which faction fits the following description:\n*${factions[correct].descriptionCensored}*\n?`
    factions.forEach((faction, index) => {
      text += `\n ${options[index]} for **${faction.name}**`
    })
    const correctOption = options[correct]
    const correctText = factions[correct].name
    const link = factions[correct].url
    return { text, options, correctOption, correctText, link }
  },
]
const TIME_FOR_QUESTION = 13
const TOTAL_ROUNDS = questions.length

const play = async () => {
  round = 13
  scores = {}
  do {
    const { text, options, correctOption, correctText, link, file } = await questions[round - 1]()
    const httpLink = link.startsWith('http') ? link : `https://classic.wowhead.com/search?q=${link}`
    const questionMessage = await gameChannel.send(`-- Round ${round}/${TOTAL_ROUNDS} --\n${text}`, { file })
    let timeLeft = TIME_FOR_QUESTION
    const timerMessage = await gameChannel.send(TIME_FOR_QUESTION)
    asyncForEach(options, option => questionMessage.react(option))
    await sleep(options.length * 600)
    for (let i = TIME_FOR_QUESTION; i >= 0; i--) {
      await timerMessage.edit(i)
      await sleep(1000)
    }
    const resultMessage = await gameChannel.send(`Round's over, the correct answer was: ${correctOption} - **${correctText}**\n${httpLink}`)
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

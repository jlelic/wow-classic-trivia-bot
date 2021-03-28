import {WoWExpansion} from "./wowhead";

const Discord = require('discord.js')
const fs = require('fs')
import BattleRoyale from './battle-royale'
import {
    getAllQuestions, getCategories, getCategoryQuestions,
    getNQuestions, getOneQuestion, getUniqueCategoryQuestions
} from './questions/index'
import TriviaGame from './game'
import {MessageEmbed} from "discord.js";
import {embedColor} from "./utils";

const token = process.env.DISCORD_BOT_TOKEN || require('./bot-token')
if (!token) {
    throw 'Missing discord bot token!'
}

let game
let battleRoyale
const categories = getCategories()
const client = new Discord.Client()
client.on('error', (err) => {
    console.log('Discord.js error:', err)
})

client.on('ready', async () => {
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    client.user.setActivity('Type !quiz help')
    // try {
    //   await connect()
    // } catch (e) {
    //   console.log('Database error:', e)
    //   exit()
    // }
    game = new TriviaGame()
    // battleRoyale = new BattleRoyale()
})

client.on('message', async (message) => {
    if (!message.content.toLowerCase().startsWith('!quiz')) {
        return
    }

    const params = message.content.split(' ')
    let replyText = 'Unknown command, use `!quiz help` for help'
    let questions = []
    switch (params[1]) {
        case 'tbc':
            questions = [
                ...getCategoryQuestions(WoWExpansion.TBC, 'abilities', 1),
                ...getUniqueCategoryQuestions(WoWExpansion.TBC, 'items', 2),
                ...getCategoryQuestions(WoWExpansion.TBC, 'npcs', 2),
                ...getCategoryQuestions(WoWExpansion.TBC, 'zones', 2),
                ...getCategoryQuestions(WoWExpansion.TBC, 'sounds', 1),
            ]
            game.play(message.channel, questions, WoWExpansion.TBC)
            return
        case 'classic':
            questions = [
                ...getUniqueCategoryQuestions(WoWExpansion.Classic, 'items', 3),
                ...getUniqueCategoryQuestions(WoWExpansion.Classic, 'abilities', 3),
                ...getUniqueCategoryQuestions(WoWExpansion.Classic, 'npcs', 2),
                ...getUniqueCategoryQuestions(WoWExpansion.Classic, 'zones', 1),
                ...getUniqueCategoryQuestions(WoWExpansion.Classic, 'sounds', 1)
            ]
            game.play(message.channel, questions, WoWExpansion.cl)
            return
        case 'custom':
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
                game.play(message.channel, getCategoryQuestions(WoWExpansion.Classic, category, num))
                return
            }
            game.play(message.channel, getNQuestions(WoWExpansion.Classic, num || 10))
            return
        case 'royale':
            const otherPlayers = message.content.match(/\d{18,18}/g) || []
            battleRoyale.play(message.channel, [message.author.id, ...otherPlayers])
            return
        case 'quick':
            game.play(message.channel, getOneQuestion(WoWExpansion.Classic))
            return
        case 'all':
            game.play(message.channel, getAllQuestions(WoWExpansion.Classic))
            return
        case 'help':
            replyText = new MessageEmbed()
                .setTitle('WoW Classic Trivia Quiz Bot')
                .setDescription('Supported commands:')
                .addFields([
                    {name: '!quiz classic', value: 'Quiz with 10 questions'},
                    {name: '!quiz custom X', value: 'Quiz with X questions'},
                    {name: '!quiz custom X C', value: 'Quiz with X questions from category C'},
                    {name: '!quiz quick', value: '1 question'},
                    {name: '!quiz all', value: 'Quiz with all questions'},
                    {name: '!quiz categories', value: 'Lists available categories'},
                    {
                        name: '!quiz tbc',
                        value: 'Quiz with 8 question from The Burning Crusade expansion (experimental)'
                    },
                    {
                        name: '\u200b',
                        value: '*Bot made by Veggie-ZandalarTribe*',
                        inline: true
                    },
                    {
                        name: '\u200b',
                        value: '*Powered by [wowhead.com](https://classic.wowhead.com)*',
                        inline: true
                    }
                ])
                .setColor(embedColor)
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

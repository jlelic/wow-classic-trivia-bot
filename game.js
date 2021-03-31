import {asyncForEach, embedColor, sleep} from './utils'
import {MessageEmbed} from "discord.js";
import {WoWExpansion} from "./wowhead";

const DEFAULT_TIME_FOR_QUESTION = 1

export default class TriviaGame {

    constructor() {
        this.scores = {}
        this.round = 0
    }

    async play(channel, questions, wowexp = WoWExpansion.Classic) {
        if (this.round > 0) {
            channel.send(`Sorry, I'm busy with a game already in progress in <#${this.gameChannel.id}>`)
            return
        }
        this.gameChannel = channel
        this.round = 1
        this.scores = {}

        try {
            do {
                const question = await questions[this.round - 1].generator(wowexp)
                const {
                    text, options, correctOption, correctText, optionsTexts, link, sound, time, image, file, spoilerImage
                } = question
                console.log(question)

                if (file) {
                    await this.gameChannel.send({files: [{attachment: file, name: 'picture.jpg'}]})
                }
                const questionMessage = await this.gameChannel.send(
                    new MessageEmbed().setAuthor(`Question ${this.round}/${questions.length}`)
                )

                let timeLeft = time || DEFAULT_TIME_FOR_QUESTION
                const timerMessage = await this.gameChannel.send(timeLeft)
                options.forEach(option => questionMessage.react(option))

                await questionMessage.awaitReactions(
                    reaction => reaction.emoji.name === options[options.length - 1],
                    {max: 1, time: options.length * 1000}
                )

                const embedMessage = this.createQuestionMessage(this.round, questions.length, text, options, optionsTexts, image)
                await questionMessage.edit(embedMessage)
                if (sound) {
                    await this.gameChannel.send({files: [{attachment: sound, name: 'sound.ogg'}]})
                }

                await this.countdownMessage(timerMessage, timeLeft)


                embedMessage.addField('Correct answer', `${correctOption} ${correctText}\n${link}`)

                const scoreUpdates = await this.updateScores(questionMessage, correctOption)
                const correctlyAnswered = []
                const incorrectlyAnswered = []
                Object.keys(scoreUpdates).forEach((userId) => scoreUpdates[userId] > 0 ? correctlyAnswered.push(userId) : incorrectlyAnswered.push(userId))

                if (correctlyAnswered.length) {
                    this.embedScoreUpdates(channel, embedMessage, '✅', scoreUpdates, correctlyAnswered)
                }
                if (incorrectlyAnswered.length) {
                    this.embedScoreUpdates(channel, embedMessage, '🚫', scoreUpdates, incorrectlyAnswered)
                }
                if (spoilerImage) {
                    embedMessage.setImage(spoilerImage)
                }

                await questionMessage.edit(embedMessage)
                this.round++
            } while (this.round <= questions.length)
            if (questions.length > 1) {
                await this.gameChannel.send(this.createResultMessage(channel, this.scores))
            }
        } catch (e) {
            console.log(e)
            console.log(e.stack)
            this.gameChannel.send('Oopsie Woopsie, something went wrong! Terminating the game...')
        } finally {
            this.round = 0
        }
    }

    createQuestionMessage(roundNum, roundsTotal, text, options, optionsTexts, image, file) {
        let description = ''
        if (optionsTexts) {
            description = options.map((option, i) => `${option} ${optionsTexts[i]}`).join('\n')
        }
        return new MessageEmbed()
            .setColor(embedColor)
            .setTitle(text)
            .setDescription(description)
            .setImage(image)
            .setAuthor(`Question ${roundNum}/${roundsTotal}`)//, 'https://i.imgur.com/wSTFkRM.png');
    }

    createResultMessage(channel, scores) {
        const medals = ['🥇','🥈','🥉']
        // const medals = [
        //     '<:smrco:619133772910034944>',
        //     '<:GrcoFace:459008572789882881>',
        //     '<:Hangover:459008691274776577>',
        //     '<:GrcoKmin:459008598799024129>',
        //     '<:GrcoKmin:459008598799024129>',
        //     '<:GrcoKmin:459008598799024129>',
        //     '<:GrcoKmin:459008598799024129>',
        //     '<:GrcoKmin:459008598799024129>',
        //     '<:GrcoKmin:459008598799024129>',
        //     '<:GrcoKmin:459008598799024129>',
        //     '<:GrcoKmin:459008598799024129>',
        //     '<:GrcoKmin:459008598799024129>'
        // ]
        const sortedScores = Object.entries(scores)
            .sort(([id1, score1], [id2, score2]) => score2 - score1)
        return new MessageEmbed()
            .setColor(embedColor)
            .setAuthor('Game Over!')
            .addField(
                'Results:',
                sortedScores
                    .map(([id, _], index) => {
                        const member = channel.members.get(id)
                        const name = (member && (member.nickname || member.user.username) || 'Unkown').slice(0, 20)
                        const prefix = medals[index] || `    ${index + 1}. `
                        return `\`\u200b\`${prefix}${name}`
                    })
                    .join('\n') || 'No scores recorded',
                true
            )
            .addField(
                '\u200b',
                sortedScores
                    .map(([id, score], index) => `\`${score}\``)
                    .join('\n') || ':(',
                true
            )
    }

    embedScoreUpdates(channel, message, prefix, scoreUpdates, toInclude) {
        message.addField(
            '\u200b',
            `${prefix} ` + toInclude.map(id => {
                const member = channel.members.get(id)
                const name = member.nickname || member.user.username
                return `${name} \`${scoreUpdates[id]}\`${scoreUpdates[id] < 0 ? '' : ''}`
            }).join(', ')
        )
    }

    async countdownMessage(timerMessage, timeLeft) {
        for (let i = timeLeft; i >= 0; i--) {
            await timerMessage.edit(i)
            await sleep(1000)
        }
        await timerMessage.delete()
    }

    formatScore(scores) {
        return Object.entries(scores)
            .sort(([id1, score1], [id2, score2]) => score2 - score1)
            .map(([id, score], index) => `${index + 1}. <@${id}> \t ${score}`)
            .join('\n')
    }

    async updateScores(question, correct) {
        const voted = new Set()
        const updates = {}
        await asyncForEach([...question.reactions.cache.values()], async reaction => {
            let scoreDiff = reaction.emoji.name === correct ? 1 : 0
            if (reaction.users.size === 1) {
                return;
            }
            [...reaction.users.cache.values()].forEach((user, index) => {
                if (!user.bot) {
                    if (voted.has(user.id)) {
                        updates[user.id] = -1
                    }
                    voted.add(user.id)
                    updates[user.id] = (updates[user.id] || 0) + scoreDiff
                    if (index === 1 && scoreDiff) {
                        updates[user.id] += 0.5
                    }
                }
            });
        });
        Object.entries(updates).map(([playerId, score]) => {
            this.scores[playerId] = (this.scores[playerId] || 0) + score
        })
            .join(', ')
        return updates
    }
}

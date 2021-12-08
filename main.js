const { Client, Intents, ThreadChannel, ThreadManager } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const { isArray } = require('util');
const { v4: uuidv4 } = require('uuid');
const ezdata = require('./linkedList');
require('./deploy')();
// const channel = new ThreadChannel();
// const manager = new ThreadManager();
let sessionInfo = new Object();
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})


client.once('ready', () => {
    console.log('Ready')
})
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    // console.log(interaction)
    switch (interaction.commandName) {
        case 'createroom':
            let roomname = interaction.options.getString('roomname')
            if (roomname) {
                // console.log(interaction.channelId);
                client.channels.fetch(interaction.channelId).then(async channel => {
                    let newThread = await channel.threads.create({
                        name: `${roomname}`,
                        autoArchiveDuration: 60,
                        reason: 'Game Room'
                    })
                    if (!sessionInfo.threads) {
                        newThread.inGame = false;
                        sessionInfo = {
                            threads: [newThread]
                        }
                        console.log(sessionInfo)

                    } else {
                        sessionInfo.threads.push(newThread)
                    }
                })
            }
            await interaction.reply({ content: 'please name the room', ephemeral: true })
            break;
        case 'play':
            if (!interaction.options.getString('color') || !interaction.options.getNumber('number')) {
                interaction.reply({ content: 'Please specify your card num or color', ephemeral: true });
            } else if (!idTest(sessionInfo.threads, interaction.channelId)) {
                interaction.reply({ content: 'looks like you are not in the game room', ephemeral: true });
            } else {
                for (let thread of sessionInfo.threads) {
                    if (thread.id === interaction.channelId) {
                        if (!thread.lastCard || thread.lastCard[0] === interaction.options.getString('color') || thread.lastCard[1] === interaction.options.getNumber('number')) {
                            if (thread.currentPlayer === interaction.user.id) {
                                for (let player of thread.players) {
                                    console.log(`player :${player.cards}`)
                                    if (cardCheck(interaction.options.getNumber('number'), interaction.options.getString('color'), player, interaction)) {
                                        if(winCheck(player.cards)){
                                            thread.inGame = false;
                                        };
                                        console.log(thread.sequence);
                                        thread.turn++;
                                        thread.currentPlayer = thread.sequence[ thread.turn % (thread.sequence.length - 1)];
                                        thread.lastCard = [interaction.options.getString('color'), interaction.options.getNumber('number')];
                                        client.users.fetch(thread.currentPlayer).then(player => {
                                            player.send('Your turn');
                                        })
                                    }
                                }
                            } else {
                                interaction.reply({ content: 'not your turn yet', ephemeral: true })
                            }
                        } else {
                            interaction.reply({ content: 'You need to either match the number or color with the last play, or you can just pass' })
                        }
                    }
                    else {
                        interaction.reply({ content: 'whether not your turn, or wrong card, you know it', ephemeral: true });
                    }
                }
            }
            break;

        case 'pass':
            if(!Array.isArray(sessionInfo.threads)) return;
            for (let thread of sessionInfo.threads) {
                if (thread.id === interaction.channelId) {
                    thread.turn++;
                    thread.currentPlayer = thread.sequence[(thread.sequence.length) % thread.turn];
                    interaction.reply({ content: 'You Passed this round!', ephemeral: true });
                    client.users.fetch(thread.currentPlayer).then(player => {
                        player.send('Your turn');
                    })
                }
            }
            break;

        case 'startgame':
            const myDeckRaw = fs.readFileSync('./deck.json', (err) => {
                if (err) console.log(err)
            });
            let myDeck = JSON.parse(myDeckRaw)['deck']
            // console.log(myDeck);
            if (!sessionInfo.threads) {
                interaction.reply({ content: 'No game avaliable', ephemeral: true });
            } else if (!idTest(sessionInfo.threads, interaction.channelId)) {
                interaction.reply({ content: 'looks like you are not in the game room', ephemeral: true });
            } else {
                for (let thread of sessionInfo.threads) {
                    if (thread.id === interaction.channelId) {
                        if(thread.inGame) {   
                            interaction.reply({content: 'nice try😒', ephemeral: true})
                            return;
                        }
                        thread.inGame = true;
                        cardDistributor(myDeck, thread.players);
                        // console.log(thread.players)
                        thread.sequence = [];
                        for (let player of thread.players) {
                            thread.sequence.push(player.user);
                        }
                        let nextPlayer = thread.sequence[0];
                        thread.currentPlayer = nextPlayer;
                        client.users.fetch(nextPlayer).then(player => {
                            player.send('Your Turn');
                        });
                        thread.turn = 0;
                    }
                }
                interaction.reply({ content: 'Game Start!' });
                console.log(sessionInfo);
            }
            break;

        case 'register':
            if (!sessionInfo.threads) {
                interaction.reply({ content: 'you need to join a game room before register', ephemeral: true });
            } else {
                for (let thread of sessionInfo.threads) {
                    if (thread.id === interaction.channelId) {
                        if (!thread.players) {
                            thread.players = [{ user: interaction.user.id }]
                        } else if (memberTest(thread.players, interaction.user.id)) {
                            interaction.reply({ content: 'You have already registered, hehe', ephemeral: true });
                            return;
                        } else {
                            thread.players.push({ user: interaction.user.id });
                        }
                        interaction.reply({ content: 'got it pal!', ephemeral: true });
                        return;
                    } else {
                        interaction.reply({ content: 'join the room, come on', ephemeral: true });
                        return;
                    }
                }
            }
            break;

        default:

            break;
    }
})

client.login(`${process.env.BOT_TOKEN}`);
function memberTest(arr, val) {
    for (let el of arr) {
        if (el.user === val) {
            return true;
        }
        return false;
    }
}
function idTest(arr, val) {
    if (!isArray(arr)) return false;
    for (let el of arr) {
        if (!el.id) {
            return false;
        } else if (el.id === val) {
            return true;
        }
    }
    return false;
}

function cardDistributor(deck, playerList) {
    if (!isArray(playerList)) return false;
    const cardForEach = 5;
    for (let player of playerList) {
        const shuffled = deck.sort(() => 0.5 - Math.random());
        let selected = shuffled.slice(0, cardForEach);
        shuffled.shift(cardForEach);
        player.cards = selected;
        client.users.fetch(player.user).then(player => {
            player.send('Your cards are: ' + String(selected));

        })
    }
}

function cardCheck(num, color, player, interaction) {
    console.log(player)
    for (let i = 0; i < player.cards.length; i++) {
        if (color === player.cards[i][0] && num === player.cards[i][1]) {
            player.cards.splice(i, 1);
            interaction.reply({ content: `Played card ${interaction.options.getNumber('number')} in color ${interaction.options.getString('color')}` });
            client.users.fetch(player.user).then(user=>{
                user.send(`Now you have ${player.cards}`);
            })
            return true;
        }

    }
    client.users.fetch(player.user).then(player => {
        player.send('You do not have the card, play again or pass');
        return false;
    })
    interaction.reply({content: 'Invalid cardplay'})
}

function winCheck(cards) {
    if (cards.length === 0) {
        client.channels.fetch(interaction.channelId).then(async channel => {
            const webhooks = await channel.fetchWebhooks();
            const webhook = webhooks.first();
            await webhook.send({
                content: 'Winner!',
                threadId: `${thread.id}`,
            });
        })
        return true;
    }

}

function getRedText(val) {
    return `\`\`\`diff\n -${val}\`\`\``;
}
function getGreenText(val) {
    return `\`\`\`diff\n+${val}\`\`\``;
}
function getBlueText(val) {
    return `\`\`\`ini\n\[${val}\]\`\`\``;
}
function getYellowText(val) {
    return `\`\`\`fix\n${val}\`\`\``
}
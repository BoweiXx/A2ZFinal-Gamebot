const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const {SlashCommandBuilder} = require('@discordjs/builders')
// const fs = require('fs');
// const commandFiles = fs.readdirSync('./command').filter(files => files.endsWith('.js'));
require("dotenv").config();
module.exports = function deploy() {
	const startGame = new SlashCommandBuilder().setName('createroom').setDescription('start a new game, with room name').addStringOption(option => option.setName('roomname').setDescription('Name of the Room'))
	const play = new SlashCommandBuilder().setName('play').setDescription('play cards!').addNumberOption(option => option.setName('number').setDescription('number of the card')).addStringOption(option=> option.setName('color').setDescription('color of the card'))
	const pass = new SlashCommandBuilder().setName('pass').setDescription('pass this turn');
	// const ready = new SlashCommandBuilder().setName('readycheck').setDescription('Ready check for everyone in the thread');
	const start = new SlashCommandBuilder().setName('startgame').setDescription('start the game with people in the thread');
	const register = new SlashCommandBuilder().setName('register').setDescription('Register yourself to the thread for play')
	const commands = [play, startGame, pass, start, register];

	// for(let commandFile of commandFiles){
	// 	const command = require(`./command/${commandFile}`);
	// 	commands.push(command.toJSON());
	// }
	const rest = new REST({ version: '9' }).setToken(`${process.env.BOT_TOKEN}`);
	rest.put(Routes.applicationGuildCommands(`${process.env.APPLICATION_ID}`, `${process.env.CLASS_GUILD_ID}`), { body: commands })
		.then(() => console.log('Successfully registered application commands.'))
		.catch(console.error);
}

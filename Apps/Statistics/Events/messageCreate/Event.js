const { Events, ChannelType } = require('discord.js');
const { Stat, Staff } = require('./Functions');

module.exports = {
    Name: Events.MessageCreate,
    System: true,

    execute: async (client, message) => {
        if (
            message.author.bot || 
            !message.guild || 
            message.webhookID || 
            message.channel.type === ChannelType.DM || 
            message.content.includes('owo') || 
            client.system.Main.Prefix.some(x => message.content.startsWith(x))
        ) return;

        try {
            Stat(client, message);
            Staff(client, message, message.guild.find);
        } catch (error) {
            client.logger.error('@messageCreate', error);
        }
    }
};
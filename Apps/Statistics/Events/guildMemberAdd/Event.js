const { Events } = require('discord.js');
const { Stat, Staff } = require('./Functions');

module.exports = {
    Name: Events.GuildMemberAdd,
    System: true,

    execute: async (client, member) => {
        if (member.guild.id !== client.system.serverID || member.user.bot || !member.guild.find) return;

        const invites = await member.guild.invites.fetch();

        try {
            Stat(client, member, member.guild.find, invites);
            Staff(client, member, member.guild.find, invites);
        } catch (error) {
            client.logger.error('@guildMemberAdd', error);
        }
    }
};
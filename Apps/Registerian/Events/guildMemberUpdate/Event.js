const { Events } = require('discord.js');
const { Role, Penal, Boost, Timeout } = require('./Functions');

module.exports = {
    Name: Events.GuildMemberUpdate,
    System: true,

    execute: async (client, oldMember, newMember) => {
        if (newMember.guild.id !== client.system.serverID || newMember.user.bot || !newMember.guild.find || !newMember.joinedAt) return;

        try {
            Role(client, oldMember, newMember, newMember.guild.find);
            Penal(client, oldMember, newMember, newMember.guild.find);
       //     Boost(client, oldMember, newMember, newMember.guild.find);
            Timeout(client, oldMember, newMember, newMember.guild.find);
        } catch (error) {
            client.logger.error('@guildMemberUpdate', error);
        }
    }
};
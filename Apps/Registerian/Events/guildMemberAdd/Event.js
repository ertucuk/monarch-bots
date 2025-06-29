const { Events } = require('discord.js');
const { Mention, Penals, BannedTag, Invasion, Suspect, Welcome } = require('./Functions');

module.exports = {
    Name: Events.GuildMemberAdd,
    System: true,

    execute: async (client, member) => {
        if (member.guild.id !== client.system.serverID || member.user.bot || !member.guild.find) return;

        const registerChannel = member.guild.channels.cache.get(member.guild.find.settings?.registerChannel);

        try {
            Mention(client, member, member.guild.find)

            const hasPenal = await Penals(client, member, member.guild.find, registerChannel);
            if (hasPenal) return;

            const hasBannedTag = await BannedTag(client, member, member.guild.find, registerChannel);
            if (hasBannedTag) return;

            const hasInvasion = await Invasion(client, member, member.guild.find, registerChannel);
            if (hasInvasion) return;

            if (member.guild.find.systems.invasion) return;

            const hasSuspect = await Suspect(client, member, member.guild.find, registerChannel);
            if (hasSuspect) return;

            Welcome(client, member, member.guild.find, registerChannel);
        } catch (error) {
            client.logger.error('@guildMemberAdd', error);
        }
    }
};
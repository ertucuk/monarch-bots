const { Events } = require('discord.js');
const { BannedTag, Tag } = require('./Functions');

module.exports = {
    Name: Events.UserUpdate,
    System: true,

    execute: async (client, oldUser, newUser) => {
        if (oldUser.bot || oldUser.displayName === newUser.displayName) return;

        const guild = client.guilds.cache.get(client.system.serverID);
        const member = guild.members.cache.get(newUser.id);

        try {
            if (!member || !guild || !guild.find || [
                guild.find.settings.underworldRole,
                guild.find.settings.quarantineRole,
                guild.find.settings.adsRole
            ].some(r => member.roles.cache.has(r))) return;

            const hasBannedTag = await BannedTag(client, oldUser, newUser, member, guild.find);
            if (hasBannedTag) return;

            Tag(client, oldUser, newUser, member, guild.find);
        } catch {
            client.logger.error('@userUpdate', error);
        }
    }
};
const { Events } = require('discord.js');

module.exports = {
    Name: Events.InviteDelete,
    System: true,

    execute: async (client, invite) => {
        if (!invite.guild || invite.guild.id !== client.system.serverID) return;

        client.invites.delete(invite.code)
        client.staffInvites.delete(invite.code)
    }
};


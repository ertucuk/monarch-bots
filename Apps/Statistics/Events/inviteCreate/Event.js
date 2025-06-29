const { Events } = require('discord.js');

module.exports = {
    Name: Events.InviteCreate,
    System: true,

    execute: async (client, invite) => {
        if (!invite.guild || invite.guild.id !== client.system.serverID) return;

        client.invites.set(invite.code, {
            code: invite.code,
            inviter: invite.inviter,
            uses: invite.uses || 0
        })

        client.staffInvites.set(invite.code, {
            code: invite.code,
            inviter: invite.inviter,
            uses: invite.uses || 0
        })
    }
};


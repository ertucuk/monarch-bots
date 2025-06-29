const { PermissionsBitField: { Flags } } = require('discord.js');

module.exports = {
    Name: 'kilit',
    Aliases: ['lock'],
    Description: 'Belirttiğin kanalı kitler.',
    Usage: 'kilit',
    Category: 'Admin',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {

        const role = message.guild.roles.everyone;
        const channelPermissions = message.channel.permissionOverwrites.cache.get(role.id) || { allow: new Set(), deny: new Set() };
        const hasSendMessagesPermission = !channelPermissions.allow.has(Flags.SendMessages) || channelPermissions.deny.has(Flags.SendMessages);
        message.channel.permissionOverwrites.edit(role.id, { SendMessages: hasSendMessagesPermission });

        message.react(await client.getEmoji('check')).catch(() => null);
        message.channel.send({
            embeds: [
                embed.setDescription(`Başarıyla kanal kilidi ${hasSendMessagesPermission ? 'açıldı.' : 'kapatıldı.'}`)
            ]
        });
    },
};
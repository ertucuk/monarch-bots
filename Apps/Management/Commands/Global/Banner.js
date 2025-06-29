const { PermissionsBitField: { Flags }, EmbedBuilder } = require('discord.js');

module.exports = {
    Name: 'banner',
    Aliases: [],
    Description: 'Kullanıcının bannerını gösterir.',
    Usage: 'banner <@User/ID>',
    Category: 'Global',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args) => {

        const member = message.mentions.members.first() || await client.users.fetch(args[0]).catch(() => null) || message.member;
        if (!member) return client.embed(message, `Kullanıcı bulunamadı!`);

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    author: { name: member.username, iconURL: member.displayAvatarURL({ dynamic: true }) },
                    color: client.getColor('random'),
                    image: { url: await member.bannerURL({ dynamic: true, size: 4096 }) },
                })
            ]
        });
    },
};
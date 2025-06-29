const { EmbedBuilder } = require('discord.js');

module.exports = {
    Name: 'avatar',
    Aliases: ['av', 'pp'],
    Description: 'Kullanıcının profil fotoğrafını gösterir.',
    Usage: 'avatar <@User/ID>',
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
                    image: { url: member.displayAvatarURL({ dynamic: true, size: 4096, format: 'png' }) }
                })
            ]
        });
    },
};
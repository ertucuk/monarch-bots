const { PermissionsBitField: { Flags }, inlineCode } = require('discord.js');

module.exports = {
    Name: 'kes',
    Aliases: ['voicekick', 'voice-kick', 'at', 'bağlantıkes'],
    Description: 'Sesli kanalda olan kullanıcıyı sesten atarsınız.',
    Usage: 'kes <@User/ID>',
    Category: 'Moderation',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            client.embed(message, 'Kullanıcı bulunamadı!')
            return;
        }

        if (member.id === message.author.id) {
            client.embed(message, 'Bu komutu kendi üzerinde kullanamazsın!');
            return;
        }

        if (!member.voice.channel) {
            client.embed(message, `Belirttiğin kullanıcı seste bulunmuyor!`);
            return;
        };

        if (client.functions.checkUser(message, member)) return;

        member.voice.disconnect();
        message.reply({
            embeds: [
                embed.setDescription(
                    `${member} kullanıcısı ${inlineCode(member.voice.channel.name)} ses kanalından çıkarıldı!`,
                ),
            ],
        });
    },
};
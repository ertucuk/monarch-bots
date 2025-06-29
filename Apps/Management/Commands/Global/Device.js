const { EmbedBuilder } = require('discord.js');

module.exports = {
    Name: 'cihaz',
    Aliases: ['device'],
    Description: 'Kullanıcının cihaz bilgisini gösterir.',
    Usage: 'cihaz <@User/ID>',
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
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!member) {
            message.reply({ content: 'Kullanıcı bulunamadı!' });
            return;
        }

        const device = member.presence?.clientStatus?.desktop ? 'Bilgisayar' : member.presence?.clientStatus?.mobile ? 'Mobil' : member.presence?.clientStatus?.web ? 'Web' : 'Bilinmiyor';
        message.reply({
            embeds: [
                new EmbedBuilder({
                    color: client.getColor('random'),
                    author: { name: member.user.username, iconURL: member.user.displayAvatarURL() },
                    description: `${member} kullanıcısı şu anda **${device}** cihazından bağlı.`
                })
            ]
        });
    }
};
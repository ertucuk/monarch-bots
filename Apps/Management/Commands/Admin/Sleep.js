const { PermissionsBitField: { Flags }, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    Name: 'sleep',
    Aliases: ['sleep'],
    Description: 'Belirttiğin kullanıcı sleep odasına atar.',
    Usage: 'sleep <@User/ID>',
    Category: 'Admin',
    Cooldown: 0,

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args) => {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            message.reply({ content: "Bir üye belirtmelisin." }).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
            return;
        }

        if (!member.voice.channel) {
            message.reply({ content: "Belirttiğiniz üye bir ses kanalında değil." }).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
            return;
        }

        const channel = message.guild.channels.cache.get(message.guild.settings.afkChannel);
        if (!channel) return;

        member.voice.setChannel(channel.id);
        message.react(await client.getEmoji('check'));
        message.reply({ content: `${member} kullanıcısı başarıyla sleep odasına atıldı.` }).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
    }
};
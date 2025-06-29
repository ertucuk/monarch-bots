const { bold } = require('discord.js');
const InviteRegExp = /(https:\/\/)?(www\.)?(discord\.gg|discord\.me|discordapp\.com\/invite|discord\.com\/invite)\/([a-z0-9-.]+)?/i;

module.exports = {
    Name: 'afk',
    Aliases: [],
    Description: 'AFK moduna geçersiniz.',
    Usage: 'afk <sebep>',
    Category: 'Global',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {
        const reason = args.join(' ') || `Şu anda meşgulüm, yakın bir zamanda geri döneceğim!`;
        if (InviteRegExp.test(reason) || message.mentions.everyone) return message.delete()

        client.afks.set(message.author.id, {
            reason: reason.length > 0 ? reason.slice(0, 2000) : null,
            timestamp: Date.now(),
            mentions: []
        })

        const name = `[AFK] ${message.member.displayName}`
        if (!message.member.displayName.startsWith('[AFK]') && 32 > name.length) message.member.setNickname(name).catch(() => { })
        message.channel.send(`${message.author}, seni etiketleyenlere ${bold('AFK')} olduğunu bildireceğim.`).then((msg) => setTimeout(() => msg.delete(), 5000));
    }
};
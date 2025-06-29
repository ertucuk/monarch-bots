const { inlineCode } = require('discord.js');
const inviteRegex = /\b(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discordapp\.com\/invite)\/([a-zA-Z0-9\-]{2,32})\b/;
const adsRegex = /([^a-zA-ZIıİiÜüĞğŞşÖöÇç\s])+/gi;

module.exports = {
    Name: 'booster',
    Aliases: ['b', 'zengin', 'rich'],
    Description: 'Boost basan üyeler nicklerini değiştirir.',
    Usage: 'booster <isim>',
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
        const boosterRole = message.guild.roles.premiumSubscriberRole
        const cashRole = message.guild.roles.cache.get(ertu.settings.richRole)

        if (!message.member.roles.cache.has(boosterRole.id) && !message.member.roles.cache.has(cashRole.id)) {
            return client.embed(message, `Bu komutu kullanabilmek için ${boosterRole} veya ${cashRole} rolüne sahip olmalısın!`);
        }

        const name = args.join(' ');
        if (!name) return client.embed(message, `Bir isim belirtmelisin!`);
        if (name.length > 32) return client.embed(message, `İsim 32 karakterden fazla olamaz!`);
        if (inviteRegex.test(name) || adsRegex.test(name)) return client.embed(message, `İsimde reklam veya davet linki olamaz!`);

        const limit = client.functions.checkLimit(message, message.author.id, 'Booster', 1);
        if (limit.hasLimit) return client.embed(message, `Bu komutu tekrar kullanabilmek için ${limit.time} beklemelisin!`);

        let newName = `${message.member.tag()} ${name}`;
        if (newName.length > 15) return client.embed(message, `İsim 15 karakterden fazla olamaz!`);
        
        message.member.setNickname(newName).catch(() => null);
        message.channel.send({ content: `İsmin başarıyla ${inlineCode(newName)} olarak değiştirildi.` })
    },
};
const ms = require('ms');

module.exports = {
    Name: 'yargı',
    Aliases: ['yargi', 'fırfır', 'oç', 'pipi'],
    Description: 'Sunucuda taşkınlık yaratan bir kullanıcıya underworld cezası vermenizi sağlar.',
    Usage: 'ban <@User/ID>',
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

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        if (!member) {
            client.embed(message, `Kullanıcı bulunamadı!`);
            return;
        }

        if (member) {
            if (client.functions.checkUser(message, member)) return;
        };

        const reason = args.splice(1).join(' ')
        if (!reason) {
            client.embed(message, `Lütfen bir sebep belirtin!`);
            return;
        }

        const limit = client.functions.checkLimit(
            message,
            message.author.id,
            'Ban',
            ertu.settings.banLimit ? Number(ertu.settings.banLimit) : 5,
            ms('1h'),
        );

        if (limit.hasLimit) {
            client.embed(
                message,
                `Atabileceğiniz maksimum ban limitine ulaştınız. Komutu ${limit.time} sonra tekrar deneyebilirsiniz.`,
            );
            return;
        };

        member.punish({
            type: 'Ban',
            message: message,
            ertu: ertu,
            reason: reason,
        });
    },
};

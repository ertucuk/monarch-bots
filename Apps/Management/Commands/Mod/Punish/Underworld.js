const ms = require('ms');

module.exports = {
    Name: 'ban',
    Aliases: ['underworld', 'sg', 'doom'],
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

        const isVictimStaff = ertu.settings.staffs.some(role => member.roles.cache.has(role));
        const isAuthorStaff = ertu.settings.staffs.some(role => message.member.roles.cache.has(role));

        if (member) {
            if (client.functions.checkUser(message, member)) return;
             if (isAuthorStaff && isVictimStaff) {
                client.embed(message, 'Yetkili bir kullanıcıyı cezalandıramazsınız.');
                return;
            }
            if (member.roles.cache.has(ertu.settings.underworldRole)) {
                client.embed(message, 'Kullanıcı zaten cezalı.');
                return;
            }
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
            type: 'Underworld',
            message: message,
            ertu: ertu,
            reason: reason,
        });
    },
};
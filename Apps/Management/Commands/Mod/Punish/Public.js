const ms = require('ms');

module.exports = {
    Name: 'pubcezalı',
    Aliases: ['pubjail', 'pubceza'],
    Description: 'Belirlenen üyeye public yasağı uygular.',
    Usage: 'pubceza <@User/ID>',
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
            if (member.roles.cache.has(ertu.settings.publicPenaltyRole)) {
                client.embed(message, 'Kullanıcı zaten cezalı.');
                return;
            }
        };

        const time = args[1] ? args[1] : undefined;
        if (!time) {
            client.embed(message, `Lütfen bir süre belirtin!`);
            return;
        }

        const reason = args.splice(1).join(' ')
        if (!reason) {
            client.embed(message, `Lütfen bir sebep belirtin!`);
            return;
        }

        const limit = client.functions.checkLimit(
            message,
            message.author.id,
            'Stream',
            5,
            ms('1h'),
        );

        if (limit.hasLimit) {
            client.embed(
                message,
                `Atabileceğiniz maksimum public ceza limitine ulaştınız. Komutu ${limit.time} sonra tekrar deneyebilirsiniz.`,
            );
            return;
        };

        member.punish({
            type: 'Public',
            message: message,
            ertu: ertu,
            reason: reason,
        });
    },
};

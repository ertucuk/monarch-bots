module.exports = {
    Name: 'unpubjail',
    Aliases: ['unpubcezalı'],
    Description: 'Public cezasını kaldırır.',
    Usage: 'unpubjail <@User/ID>',
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

        if (!member.roles.cache.has(ertu.settings.publicPenaltyRole)) {
            client.embed(message, 'Kullanıcının cezası yok.');
            return;
        }

        const reason = args.slice(1).join(' ')
        if (!reason) {
            client.embed(message, 'Geçerli bir sebep belirtmelisiniz.')
            return;
        }

        member.unPunish({
            type: 'Public',
            message: message,
            ertu: ertu,
            reason: reason,
        });
    },
};
module.exports = {
    Name: 'unads',
    Aliases: ['unreklam'],
    Description: 'Reklam yapan kullanıcının cezasını kaldırırsınız.',
    Usage: 'unads <@User/ID>',
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

        if (!member.roles.cache.has(ertu.settings.adsRole)) {
            client.embed(message, 'Kullanıcının cezası yok.');
            return;
        }

        const reason = args.slice(1).join(' ')
        if (!reason) {
            client.embed(message, 'Geçerli bir sebep belirtmelisiniz.')
            return;
        }

        member.unPunish({
            type: 'Ads',
            message: message,
            ertu: ertu,
            reason: reason,
        });
    },
};
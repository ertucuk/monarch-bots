const { inlineCode } = require('discord.js');

module.exports = {
    Name: 'isim',
    Aliases: ['i', 'nick', 'isimdegistir'],
    Description: 'Belirtilen üyenin ismini ve yaşını güncellemek için kullanılır.',
    Usage: 'isim <@User/ID>',
    Category: 'Register',
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

        if (client.functions.checkUser(message, member)) return;

        let name;
        if (ertu.systems.needName) {
            args = args.splice(1)
            name = args.filter((arg) => isNaN(parseInt(arg))).map((arg) => arg[0].toUpperCase() + arg.slice(1).toLowerCase()).join(' ');

            if (!name || name.length > 15) {
                client.embed(message, '15 karakteri geçmeyecek isim girmelisin.');
                return;
            };
        };

        if (ertu.systems.needAge) {
            const age = args.filter((arg) => !isNaN(parseInt(arg)))[0] || undefined;
            if (!age || age.length > 2) {
                client.embed(message, '2 karakteri geçmeyecek yaş girmelisin.');
                return;
            };

            const numAge = Number(age);
            if (ertu.settings.minAge && ertu.settings.minAge > numAge) {
                client.embed(
                    message,
                    `Sunucuya ${inlineCode(ertu.settings.minAge.toString())} yaşının altındaki üyeleri kaydedemezsin.`,
                );
                return;
            }

            name = `${name} | ${age}`;
        };

        member.rename(name, message.member, message)
    },
};
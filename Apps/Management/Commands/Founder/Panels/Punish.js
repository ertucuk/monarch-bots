const { ActionRowBuilder, ButtonBuilder, ButtonStyle, bold, inlineCode } = require('discord.js');

module.exports = {
    Name: 'cezapanel',
    Aliases: ['ceza-panel'],
    Description: 'Streamer paneli',
    Usage: 'cezapanel',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'punish:list',
                    label: 'Cezalarım',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    custom_id: 'punish:last',
                    label: 'Kalan Zamanım?',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    custom_id: 'punish:complaint',
                    label: 'İtiraz Et!',
                    style: ButtonStyle.Success,
                })
            ]
        });

        message.delete().catch(() => { });
        message.channel.send({
            components: [row],
            content: [
                `### Merhaba ${bold(inlineCode(message.guild?.name || 'ertu'))} ceza paneline hoşgeldiniz.`,

                `Aşağıda ki düğmelerden cezalarınız hakkında detaylı bilgi alabilirsiniz. Sorun çözmeciye cezanızı itiraz mı etmek istiyorsunuz? **"İtiraz Et!"** düğmesi ile bildirebilirsiniz.`,
            ].join('\n\n'),
        })
    },
};
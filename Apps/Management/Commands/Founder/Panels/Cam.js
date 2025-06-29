const { ActionRowBuilder, ButtonBuilder, ButtonStyle, roleMention } = require('discord.js');

module.exports = {
    Name: 'campanel',
    Aliases: ['cam-panel'],
    Description: 'Cam başvuru panelini açar.',
    Usage: 'campanel', 
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

        if (!ertu.settings.camRole) return message.channel.send({ content: `${await client.getEmoji('mark')} Cam rolü ayarlanmamış.` });

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'cam:appeal',
                    label: 'Kamera',
                    style: ButtonStyle.Secondary,
                    emoji: '1359127428575924276'
                })
            ]
        });

        message.delete().catch(() => { });
        message.channel.send({
            content: `${await client.getEmoji('arrow')} Aşağıdaki butona tıklayarak ${roleMention(ertu.settings.camRole)} rolünü alabilirsin.`,
            components: [row],
        });
    },
};
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    Name: 'top',
    Aliases: ['sıralama'],
    Description: 'SSunucudaki en aktif üyeleri sıralar.',
    Usage: 'top',
    Category: 'Statistics',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {
        let dayCount = 0;
        if (args[0] && !isNaN(args[0])) {
            dayCount = parseInt(args[0]);
        }

        const titlesAndKeys = {
            messages: { text: 'Mesaj Sıralaması', emoji: '📝' },
            voices: { text: 'Ses Sıralaması', emoji: '🔊' },
            cameras: { text: 'Kamera Sıralaması', emoji: '📷' },
            streams: { text: 'Yayın Sıralaması', emoji: '📺' },
            register: { text: 'Kayıt Sıralaması', emoji: '📋' },
            invites: { text: 'Davet Sıralaması', emoji: '✉️' },
            staff: { text: 'Yetkili Sıralaması', emoji: '🔑' },
        }

        const row = new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    customId: 'top',
                    placeholder: dayCount ? `${dayCount} Günlük Sıralama` : 'Lütfen bir kategori seçin.',
                    options: Object.keys(titlesAndKeys).map((key) => ({
                        label: titlesAndKeys[key].text,
                        value: key,
                        emoji: titlesAndKeys[key].emoji
                    }))
                })
            ]
        })

        const question = await message.channel.send({
            components: [row],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 2,
        });

        collector.on('collect', async (i) => {
            collector.stop();
            i.deferUpdate();
            client.functions.pagination(client, question, i.values[0], message.author.id, dayCount);
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.functions.timesUp()] });
        });
    },
};

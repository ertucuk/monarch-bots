const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');

module.exports = {
    Name: 'streamerpanel',
    Aliases: ['streamer-panel'],
    Description: 'Streamer yönetim paneli',
    Usage: 'streamerpanel',
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

        const image = await client.functions.generateStreamerPanel(client);
        if (!image) return message.channel.send({ content: 'Bir hata oluştu.' });

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'streamerRoom:info',
                    label: 'Oda Bilgisi',
                    style: ButtonStyle.Primary
                }),
                new ButtonBuilder({
                    customId: 'streamerRoom:owner',
                    label: 'Oda Sahipliğini Aktar',
                    style: ButtonStyle.Primary
                }),
                new ButtonBuilder({
                    customId: 'streamerRoom:permission',
                    label: 'Odaya İzin Ekle/Çıkar',
                    style: ButtonStyle.Primary
                }),
            ]
        });

        message.delete().catch(() => { });
        message.channel.send({
            components: [row],
            files: [new AttachmentBuilder(image, { name: 'streamer-panel.png' })],
        });
    },
}
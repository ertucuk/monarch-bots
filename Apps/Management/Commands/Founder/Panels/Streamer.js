const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');

module.exports = {
    Name: 'streamerbaşvuru',
    Aliases: ['streamer-başvuru'],
    Description: 'Streamer başvuru paneli',
    Usage: 'streamerbaşvuru',
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

        if (!ertu.settings.streamerRole) return message.channel.send({ content: `${await client.getEmoji('mark')} Streamer rolü ayarlanmamış.` });

        const image = await client.functions.generateStreamerAppealPanel();
        if (!image) return message.channel.send('Panel oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'streamer:appeal',
                    label: 'Başvuru Yap',
                    style: ButtonStyle.Secondary,
                    emoji: '1336476845650219049'
                }),

                new ButtonBuilder({
                    label: 'Speedtest',
                    style: ButtonStyle.Link,
                    url: 'https://www.speedtest.net/',
                })
            ]
        });

        message.delete().catch(() => { });
        await message.channel.send({
            files: [new AttachmentBuilder(image, { name: 'streamer-panel.png' })],
            components: [row]
        });
    },
};
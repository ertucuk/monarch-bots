const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');

module.exports = {
    Name: 'secretroom',
    Aliases: ['secretrooms', 'gizlioda', 'privateroom'],
    Description: 'Sunucunuzda gizli oda oluşturur.',
    Usage: 'secretroom',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {

        const image = await client.functions.generateSecretRoomPanel(client);
        if (!image) return message.channel.send({ content: 'Bir hata oluştu.' });

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    emoji: `${await client.getEmojiID('change')}`,
                    customId: 'secretroom:change',
                    style: ButtonStyle.Secondary
                }),

                new ButtonBuilder({
                    emoji: `${await client.getEmojiID('lock')}`,
                    customId: 'secretroom:lock',
                    style: ButtonStyle.Secondary
                }),

                new ButtonBuilder({
                    emoji: `${await client.getEmojiID('add')}`,
                    customId: 'secretroom:member',
                    style: ButtonStyle.Secondary
                })
            ]
        });

        const row2 = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    emoji: `${await client.getEmojiID('limit')}`,
                    customId: 'secretroom:limit',
                    style: ButtonStyle.Secondary
                }),

                new ButtonBuilder({
                    emoji: `${await client.getEmojiID('visible')}`,
                    customId: 'secretroom:visible',
                    style: ButtonStyle.Secondary
                }),

                new ButtonBuilder({
                    emoji: `${await client.getEmojiID('member')}`,
                    customId: 'secretroom:list',
                    style: ButtonStyle.Secondary
                }),
            ]
        });

        message.delete().catch(() => { });
        message.channel.send({
            files: [new AttachmentBuilder(image, { name: 'secretroom-panel.png' })],
            components: [row, row2]
        });
    },
};
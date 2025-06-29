const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, bold, inlineCode } = require('discord.js');

module.exports = {
    Name: 'allmute',
    Aliases: ['muteall'],
    Description: 'Tüm kullanıcıları susturur.',
    Usage: 'muteall',
    Category: 'Admin',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {
        if (!message.member?.voice.channelId) {
            client.embed(message, 'Bir ses kanalında bulunman gerekiyor.');
            return;
        }

        const channel = message.member?.voice.channel;
        if (!channel) return client.embed(message, 'Bir ses kanalında olmalısın.');
        if (3 >= channel.members.size) return client.embed(message, 'Kanalda 3 veya daha fazla kişi olmalı.');

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'mute',
                    style: ButtonStyle.Secondary,
                    emoji: {
                        id: '1301943774653448192'
                    }
                }),

                new ButtonBuilder({
                    custom_id: 'unmute',
                    style: ButtonStyle.Secondary,
                    emoji: {
                        id: '1301943787832213544'
                    }
                })
            ]
        });

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    `${channel} ${inlineCode(channel.id)} adlı kanalda sesteki kullanıcılara yapacağınız işlemi seçin.`,
                ),
            ],
            components: [row],
        });

        const filter = (i) => i.user.id === message.author.id && i.isButton();
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i) => {
            i.deferUpdate();
            if (i.customId === 'mute') {
                if (channel) channel.members.filter((m) => m.id !== message.member?.id && !m.voice.serverMute).forEach((m) => m.voice.setMute(true, message.author.displayName));

                message.channel.send({
                    embeds: [
                        embed.setDescription(
                            `${channel} adlı kanaldaki herkesin konuşması ${bold(`kapatıldı`)}.`,
                        ),
                    ],
                });
            }

            if (i.customId === 'unmute') {
                if (channel) channel.members.filter((m) => m.id !== message.member?.id && m.voice && m.voice.serverMute).forEach((m) => m.voice.setMute(false, message.author.displayName));

                message.channel.send({
                    embeds: [
                        embed.setDescription(
                            `${channel} adlı kanaldaki herkesin konuşması ${bold(`açıldı`)}.`,
                        ),
                    ],
                });
            }

            collector.on('end', (_, reason) => {
                if (reason === 'time') question.edit({ components: [client.functions.timesUp()] });
            });
        });
    },
};
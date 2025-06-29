const { ActionRowBuilder, ChannelSelectMenuBuilder, ComponentType, inlineCode, ChannelType } = require('discord.js');

module.exports = {
    Name: 'herkesitaşı',
    Aliases: ['herkesi-taşı', 'all-transport', 'allmove', 'herkesi-tasi', 'herkesitasi'],
    Description: 'Ses kanalında bulunan tüm kullanıcıları belirtilen kanala taşır.',
    Usage: 'herkesitaşı <menüden kanal seç>',
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

        const memberVoiceChannel = message.member.voice.channel;
        const row = new ActionRowBuilder({
            components: [
                new ChannelSelectMenuBuilder({
                    custom_id: 'menu',
                    placeholder: 'Kanal Seç',
                    channel_types: [ChannelType.GuildVoice],
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    `${memberVoiceChannel} kanalında bulunan ${inlineCode(
                        memberVoiceChannel?.members.size.toString() || 'bilinmeyen',
                    )} adet üyenin taşınacağı kanalı seç.`,
                ),
            ],
            components: [row],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60,
            componentType: ComponentType.ChannelSelect,
        });

        collector.on('collect', async (i) => {
            const channel = message.guild.channels.cache.get(i.values[0]);
            message.member?.voice.channel?.members.forEach((b) => b.voice.setChannel(channel.id).catch(() => null))

            question.edit({
                embeds: [
                    embed.setDescription(
                        `${memberVoiceChannel} kanalında bulunan üyeler ${channel} adlı kanala taşındı.`,
                    ),
                ],
                components: [],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.functions.timesUp()] });
        });
    }
};
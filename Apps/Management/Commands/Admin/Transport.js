const { PermissionsBitField: { Flags }, ChannelType, ActionRowBuilder, ChannelSelectMenuBuilder, ComponentType } = require('discord.js');

module.exports = {
    Name: 'transport',
    Aliases: ['taşı', 'taşıyıcı', 'taşıyıcılar', 'taşıyıcılarım', 'taşıyıcılarımı', 'tasi'],
    Description: 'Bir kullanıcıyı bir ses kanalından diğerine taşır.',
    Usage: 'taşı <@User/ID>',
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

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) return client.embed(message, 'Geçerli bir üye belirtmelisiniz.');
        if (!member.voice.channelId) return client.embed(message, 'Belirtilen üye bir ses kanalında değil.');

        const row = new ActionRowBuilder({
            components: [
                new ChannelSelectMenuBuilder({
                    custom_id: 'menu',
                    placeholder: 'Kanal Seç',
                    channel_types: [ChannelType.GuildVoice]
                })
            ]
        });

        const question = await message.channel.send({
            embeds: [embed.setDescription(`${member} kullanıcısını hangi ses kanalına taşımak istersiniz?`)],
            components: [row]
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60,
            componentType: ComponentType.ChannelSelect,
        });

        collector.on('collect', async (i) => {
            const channel = message.guild.channels.cache.get(i.values[0]);
            if (!channel.permissionsFor(message.member).has(Flags.Connect)) {
                message.edit({
                    embeds: [
                        embed.setDescription('Kanala katılma iznin olmadığından işlem iptal edildi.'),
                    ],
                    components: [],
                });
                return;
            }

            if (member.voice.channelId) member.voice.setChannel(channel.id);

            question.edit({
                embeds: [
                    embed.setDescription(`${member} adlı kullanıcı ${channel} adlı kanala taşındı.`)
                ],
                components: [],
            });
        });
    },
};
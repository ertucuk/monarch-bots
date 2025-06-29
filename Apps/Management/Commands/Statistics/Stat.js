const {
    bold,
    inlineCode,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    SeparatorSpacingSize,
    TextDisplayBuilder
} = require('discord.js');

module.exports = {
    Name: 'stat',
    Aliases: ['verilerim', 'stats'],
    Description: 'Istatistiklerinizi gösterir.',
    Usage: 'stat',
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
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!member) {
            client.embed(message, `Kullanıcı bulunamadı!`);
            return;
        }

        if (member.user.bot) {
            client.embed(message, 'Botların verisi bulunamaz!');
            return;
        }

        const document = await member.stats(args[0] ? Number(args[0]) : undefined);
        if (!document) {
            client.embed(message, 'Veri bulunmuyor.');
            return;
        }

        const argIndex = member.id !== message.author.id ? 1 : 0;
        let wantedDay = args[argIndex] ? Number(args[argIndex]) : document.day;
        if (!wantedDay || 0 >= wantedDay) {
            client.embed(message, 'Geçerli gün sayısı belirt!');
            return;
        };

        if (wantedDay > 365) wantedDay = document.day;

        const button = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'back',
                    label: 'Geri',
                    style: ButtonStyle.Danger,
                })
            ]
        })

        const selectMenu = new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    customId: 'stat',
                    placeholder: 'Diğer verileri görmek için tıkla.',
                    options: [
                        {
                            label: 'Kayıt İstatistiği',
                            value: 'register',
                            description: 'Kayıt verilerini gösterir.',
                        },
                        {
                            label: 'Davet İstatistiği',
                            value: 'invite',
                            description: 'Davet verilerini gösterir.',
                        },
                        {
                            label: 'Tag Aldırma İstatistiği',
                            value: 'tagged',
                            description: 'Taglı verilerini gösterir.',
                        },
                        {
                            label: 'Yetki Aldırma İstatistiği',
                            value: 'authority',
                            description: 'Yetki verilerini gösterir.',
                        },
                        {
                            label: 'Sorun Çözme İstatistiği',
                            value: 'problem',
                            description: 'Sorun çözme verilerini gösterir.',
                        },

                    ]
                })
            ]
        })

        const container = new ContainerBuilder();
        
        const title = new TextDisplayBuilder().setContent(`${member} adlı kullanıcının ${bold(`${wantedDay} günlük`)} veri bilgileri;`)
        container.addTextDisplayComponents(title);  
        container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            [
                `**Toplam Kategori Sıralaması (${client.functions.formatDurations(document.voice)})**`,
                (await Promise.all(document.category.voice.categories
                    .filter((d) => message.guild?.channels.cache.has(d.id))
                    .map(async (data) => {
                        const channel = message.guild?.channels.cache.get(data.id)?.name || '#silinmiş-kanal';
                        if (!channel) return;

                        return `${await client.getEmoji('point')} #${channel}: ${inlineCode(client.functions.formatDurations(data.value))}`;
                    })
                )).slice(0, 10).join('\n') || 'Veri bulunamadı.'
            ].join('\n')
        ))

        container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            [
                `**Toplam Ses Kanal Sıralaması (Toplam ${document.voiceChannelSize} kanalda durmuş)**`,
                (await Promise.all(document.channels.voice.channels
                    .filter((d) => message.guild?.channels.cache.has(d.id))
                    .map(async (data) => {
                        const channel = message.guild?.channels.cache.get(data.id) || '#silinmiş-kanal';
                        if (!channel) return;

                        return `${await client.getEmoji('point')} ${channel}: ${inlineCode(client.functions.formatDurations(data.value))}`;
                    })
                )).slice(0, 10).join('\n') || 'Veri bulunamadı.'
            ].join('\n')
        ))

        container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            [
                `**Toplam Yayın Kanal Sıralaması (${client.functions.formatDurations(document.stream)})**`,
                (await Promise.all(document.channels.stream.channels
                    .filter((d) => message.guild?.channels.cache.has(d.id))
                    .map(async (data) => {
                        const channel = message.guild?.channels.cache.get(data.id) || '#silinmiş-kanal';
                        if (!channel) return;

                        return `${await client.getEmoji('point')} ${channel}: ${inlineCode(client.functions.formatDurations(data.value))}`;
                    })
                )).slice(0, 10).join('\n') || 'Veri bulunamadı.'
            ].join('\n')
        ))

        container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            [
                `**Toplam Kamera Kanal Sıralaması (${client.functions.formatDurations(document.camera)})**`,
                (await Promise.all(document.channels.camera.channels
                    .filter((d) => message.guild?.channels.cache.has(d.id))
                    .map(async (data) => {
                        const channel = message.guild?.channels.cache.get(data.id) || '#silinmiş-kanal';
                        if (!channel) return;

                        return `${await client.getEmoji('point')} ${channel}: ${inlineCode(client.functions.formatDurations(data.value))}`;
                    })
                )).slice(0, 10).join('\n') || 'Veri bulunamadı.'
            ].join('\n')
        ))

        container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            [
                `**Toplam Mesaj Kanal Sıralaması (${document.message} Mesaj)**`,
                (await Promise.all(document.channels.message.channels
                    .filter((d) => message.guild?.channels.cache.has(d.id))
                    .map(async (data) => {
                        const channel = message.guild?.channels.cache.get(data.id) || '#silinmiş-kanal';
                        if (!channel) return;

                        return `${await client.getEmoji('point')} ${channel}: ${inlineCode(data.value + ' mesaj')}`;
                    })
                )).slice(0, 10).join('\n') || 'Veri bulunamadı.'
            ].join('\n')
        ))

        const question = await message.channel.send({
            components: client.staff.check(member, ertu) ? [container, selectMenu] : [container],
            flags: [MessageFlags.IsComponentsV2],
            allowedMentions: { parse: [] }
        });

        const collector = question.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 1000 * 60 * 2
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'back') {
                await i.deferUpdate();
                return question.edit({
                    components: client.staff.check(member, ertu) ? [container, selectMenu] : [container],
                    flags: [MessageFlags.IsComponentsV2]
                });
            }

            if (i.customId === 'stat') {
                await i.deferUpdate();

                if (i.values[0] === 'register') {
                    const registerContainer = new ContainerBuilder();
                    registerContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent([
                        `${member}, ${bold(`${wantedDay} günde ${document?.register.length || 0} kez`)} kayıt işlemi gerçekleştirmiş.`,
                        document?.register.length ?
                            `${document.register.map((d, i) => {
                                return `${client.timestamp(d.date)} - <@${d.user}> (${bold(d.gender)})`;
                            }).join('\n')}` : 'Kayıt verisi bulunamadı.',
                    ].join('\n\n')));

                    question.edit({
                        components: [registerContainer, button],
                        flags: [MessageFlags.IsComponentsV2],
                        allowedMentions: { parse: [] }
                    })
                }

                if (i.values[0] === 'invite') {
                    const inviteContainer = new ContainerBuilder();
                    inviteContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent([
                        `${member}, ${bold(`${wantedDay} günde ${document?.invite.length || 0} kez`)} davet işlemi gerçekleştirmiş.`,
                        document?.invite.length ?
                            `${document.invite.map((x) => {
                                return `${client.timestamp(x.date)} - <@${x.user}>`;
                            }).join('\n')}` : 'Davet verisi bulunamadı.',
                    ].join('\n\n')));

                    question.edit({
                        components: [inviteContainer, button],
                        flags: [MessageFlags.IsComponentsV2],
                        allowedMentions: { parse: [] }
                    })
                }

                if (i.values[0] === 'tagged') {
                    const taggedContainer = new ContainerBuilder();
                    taggedContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent([
                        `${member}, ${bold(`${wantedDay} günde ${document?.taggeds.length || 0} kez`)} taglı aldırma işlemi gerçekleştirmiş.`,
                        document?.taggeds.length ?
                            `${document.taggeds.map((t) => {
                                const tagged = message.guild?.members.cache.get(t.user)
                                return `${tagged ? tagged : '[@bulunamadı](https://ertu.live)'} ${tagged ? tagged?.tag() ? 'Hala Tagda' : 'Tagı Salmış' : 'Tagı Salmış'} - ${client.timestamp(t.date)}`;
                            }).join('\n')}` : 'Taglı aldırma verisi bulunamadı.',
                    ].join('\n\n')));

                    question.edit({
                        components: [taggedContainer, button],
                        flags: [MessageFlags.IsComponentsV2],
                        allowedMentions: { parse: [] }
                    })
                }

                if (i.values[0] === 'authority') {
                    const authorityContainer = new ContainerBuilder();
                    authorityContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent([
                        `${member}, ${bold(`${wantedDay} günde ${document?.staffs.length || 0} kez`)} yetki aldırma işlemi gerçekleştirmiş.`,
                        document?.staffs.length ?
                            `${document.staffs.map((s) => {
                                const staff = message.guild.members?.cache.get(s.user);
                                return `${inlineCode(` ${i + 1}. `)} ${staff ? staff : '[@bulunamadı](https://ertu.live)'} ${staff ? ertu.settings.staffs.some(x => staff.roles.cache.has(x)) ? 'Hala Yetkili' : 'Yetkili Değil' : 'Yetkili Değil'} - ${client.timestamp(s.date)}`;
                            }).join('\n')}` : 'Yetki aldırma verisi bulunamadı.',
                    ].join('\n\n')));

                    question.edit({
                        components: [authorityContainer, button],
                        flags: [MessageFlags.IsComponentsV2],
                        allowedMentions: { parse: [] }
                    })
                }

                if (i.values[0] === 'problem') {
                    const problemContainer = new ContainerBuilder();
                    problemContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent([
                        `${member}, ${bold(`${wantedDay} günde ${document?.solvers.length || 0} kez`)} sorun çözme işlemi gerçekleştirmiş.`,
                        document?.solvers.length ?
                            `${document.solvers.map((p) => {
                                return `${inlineCode(` ${i + 1}. `)} <@${p.problem}> - ${client.timestamp(p.endedAt)}`;
                            }).join('\n')}` : 'Sorun çözme verisi bulunamadı.',
                    ].join('\n\n')));

                    question.edit({
                        components: [problemContainer, button],
                        flags: [MessageFlags.IsComponentsV2],
                        allowedMentions: { parse: [] }
                    })
                }
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                question.edit({ components: [container, client.functions.timesUp()] });
            }
        });
    },
};
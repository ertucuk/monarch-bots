const {
    TextInputStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    UserSelectMenuBuilder,
    ContainerBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    ThumbnailBuilder,
    bold,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require('discord.js');
const { UserModel } = require('../../../../../Global/Settings/Schemas');
const inviteRegex = /\b(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discordapp\.com\/invite)\/([a-zA-Z0-9\-]{2,32})\b/;
const adsRegex = /([^a-zA-ZIıİiÜüĞğŞşÖöÇç\s])+/gi;

module.exports = async function Loca(client, interaction, route, ertu) {

    const member = interaction.guild.members.cache.get(interaction.user.id);
    const existingRoom = (ertu.locaRooms || []).find(x => x.owner === member.id);

    if (route === 'create') {
        if (existingRoom) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Hata!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Zaten bir loca odası oluşturmuşsunuz. ',
                })
            ], ephemeral: true
        });

        const row = new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    customId: 'locaRoomSelect',
                    placeholder: 'Lütfen aşağıdan bir seçenek seçiniz.',
                    options: [
                        {
                            label: '1 Günlük Oda Paketi',
                            description: '1 Günlük Oda Paketi',
                            value: 'loca:oneDay',
                        },
                        {
                            label: '7 Günlük Oda Paketi',
                            description: '7 Günlük Oda Paketi',
                            value: 'loca:sevenDays',
                        },
                        {
                            label: '30 Günlük Oda Paketi',
                            description: '30 Günlük Oda Paketi',
                            value: 'loca:thirtyDays',
                        },
                    ],
                })
            ],
        })

        const question = await interaction.reply({
            content: 'Loca odası oluşturmak için lütfen aşağıdaki menüden bir oda paketi seçiniz.',
            components: [row],
            ephemeral: true
        });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.customId === 'locaRoomSelect' && i.user.id === interaction.user.id,
            time: 60000
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'locaRoomSelect') {
                const selectedValue = i.values[0];

                const document = await UserModel.findOne({ id: member.id });
                const coin = document ? document.monarchCoin : 0;

                if (selectedValue === 'loca:oneDay') {
                    if (coin < 1000) return question.edit({
                        content: null,
                        components: [],
                        embeds: [
                            new EmbedBuilder({
                                title: 'Hata!',
                                image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                                description: 'Loca odası oluşturmak için 1000 Monarch Coin gerekmektedir.',
                            })
                        ], ephemeral: true
                    });

                    await createLocaRoom(question, i, 1, ertu);
                    return;
                } else if (selectedValue === 'loca:sevenDays') {
                    if (coin < 5000) return question.edit({
                        content: null,
                        components: [],
                        embeds: [
                            new EmbedBuilder({
                                title: 'Hata!',
                                image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                                description: 'Loca odası oluşturmak için 5000 Monarch Coin gerekmektedir.',
                            })
                        ], ephemeral: true
                    });

                    await createLocaRoom(question, i, 7, ertu);
                    return;
                } else if (selectedValue === 'loca:thirtyDays') {
                    if (coin < 15000) return question.edit({
                        content: null,
                        components: [],
                        embeds: [
                            new EmbedBuilder({
                                title: 'Hata!',
                                image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                                description: 'Loca odası oluşturmak için 15000 Monarch Coin gerekmektedir.',
                            })
                        ], ephemeral: true
                    });

                    await createLocaRoom(question, i, 30, ertu);
                    return;
                }

                collector.stop();
            }
        });
    }

    if (route === 'limit') {

        if (!existingRoom) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        const channel = interaction.guild.channels.cache.get(existingRoom.channel);
        if (!channel) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        const row = new ModalBuilder()
            .setTitle('Limit Değiştir')
            .setCustomId('changingLimit')
            .setComponents(
                new ActionRowBuilder().setComponents(new TextInputBuilder().setCustomId('channelLimit').setLabel('Oda limitini giriniz.').setStyle(TextInputStyle.Short)),
            );

        interaction.showModal(row)

        const modalCollected = await interaction.awaitModalSubmit({ time: 1000 * 60 * 2 });
        const channelLimit = modalCollected.fields.getTextInputValue('channelLimit');

        if (modalCollected) {
            if (isNaN(channelLimit)) return modalCollected.reply({ content: 'Geçerli bir limit belirtmelisiniz.', ephemeral: true });

            await channel.setUserLimit(channelLimit).catch((err) => console.error())

            modalCollected.reply({
                content: `Oda limiti başarıyla değiştirildi: ${bold(channelLimit)}`,
                ephemeral: true
            });
        }
    }

    if (route === 'edit') {
        if (!existingRoom) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        const channel = interaction.guild.channels.cache.get(existingRoom.channel);
        if (!channel) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        const row = new ModalBuilder()
            .setTitle('Oda Adını Değiştir')
            .setCustomId('changingName')
            .setComponents(
                new ActionRowBuilder().setComponents(new TextInputBuilder().setCustomId('channelName').setLabel('Oda adını giriniz.').setStyle(TextInputStyle.Short)),
            );

        interaction.showModal(row)

        const modalCollected = await interaction.awaitModalSubmit({ time: 1000 * 60 * 2 });
        const channelName = modalCollected.fields.getTextInputValue('channelName');

        if (modalCollected) {
            if (channelName.length < 2 || channelName.length > 100) return modalCollected.reply({ content: 'Geçerli bir oda adı belirtmelisiniz.', ephemeral: true });
            if (adsRegex.test(channelName)) return modalCollected.reply({ content: 'Oda adında reklam içerikleri bulunamaz.', ephemeral: true });
            if (inviteRegex.test(channelName)) return modalCollected.reply({ content: 'Oda adında davet linki bulunamaz.', ephemeral: true });

            await channel.setName(channelName).catch((err) => console.error())

            modalCollected.reply({
                content: `Oda adı başarıyla değiştirildi: ${bold(channelName)}`,
                ephemeral: true
            });
        }
    }

    if (route === 'lock') {
        if (!existingRoom) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        const channel = interaction.guild.channels.cache.get(existingRoom.channel);
        if (!channel) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        const permissions = channel.permissionOverwrites.cache.get(interaction.guild.id);
        if (permissions && permissions.deny.has(PermissionFlagsBits.Connect)) {
            await channel.permissionOverwrites.edit(interaction.guild.id, { 1048576: true });
            interaction.reply({ content: 'Kanal herkese açıldı.', ephemeral: true });
        } else {
            await channel.permissionOverwrites.edit(interaction.guild.id, { 1048576: false });
            interaction.reply({ content: 'Kanal herkese kapatıldı.', ephemeral: true });
        }
    }

    if (route === 'addUser') {
        if (!existingRoom) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        const channel = interaction.guild.channels.cache.get(existingRoom.channel);
        if (!channel) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        const row = new ActionRowBuilder({
            components: [
                new UserSelectMenuBuilder({
                    customId: 'add_permission',
                    placeholder: 'Üye seç.',
                    maxValues: 1
                })
            ]
        });

        await interaction.reply({
            content: 'Lütfen aşağıdan bir üye seçiniz.',
            components: [row],
            ephemeral: true
        });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: interaction => interaction.user.id === interaction.user.id,
            time: 60000
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'add_permission') {
                const user = i.values[0];
                const member = interaction.guild.members.cache.get(user);

                if (!member) return i.reply({ content: 'Geçersiz üye seçimi.', ephemeral: true });
                await channel.permissionOverwrites.edit(user, {
                    [PermissionFlagsBits.Connect]: true,
                    [PermissionFlagsBits.Stream]: true,
                    [PermissionFlagsBits.ViewChannel]: true,
                });

                await i.update({
                    content: `<@${member.id}> kullanıcısına odaya bağlanma izni verildi.`,
                    components: [],
                    ephemeral: true
                });
            }
        });
    }

    if (route === 'removeUser') {
        if (!existingRoom) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        const channel = interaction.guild.channels.cache.get(existingRoom.channel);
        if (!channel) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        const allowedUsers = channel.permissionOverwrites.cache.filter(overwrite =>
            overwrite.allow.has(PermissionFlagsBits.Connect) && overwrite.type === 1
        );

        if (allowedUsers.size === 0) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Mümkün Değil!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odasında izinli kullanıcı bulunamadı.',
                })
            ], ephemeral: true
        });

        const allowedOptions = allowedUsers
            .filter(x => x.id !== interaction.user.id)
            .map(user => ({
                label: interaction.guild.members.cache.get(user.id)?.displayName || `Kullanıcı: ${user.id}`,
                value: user.id
            }));

        const row = new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    customId: 'remove_permission',
                    placeholder: 'Üye seç.',
                    maxValues: 1,
                    options: allowedOptions.slice(0, 25).length > 0 ? allowedOptions.slice(0, 25) : [{
                        label: 'Kimse mevcut değil',
                        value: 'none',
                        description: 'Odaya izinli kullanıcı yok.'
                    }],

                })
            ]
        });

        await interaction.reply({
            content: 'Lütfen aşağıdan bir üye seçiniz.',
            components: [row],
            ephemeral: true
        });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: interaction => interaction.user.id === interaction.user.id,
            time: 60000
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'remove_permission') {
                const user = i.values[0];

                const member = interaction.guild.members.cache.get(user);
                if (!member) return i.reply({ content: 'Geçersiz üye seçimi.', ephemeral: true });

                await channel.permissionOverwrites.delete(user);

                await i.update({
                    content: `<@${member.id}> kullanıcısının odaya bağlanma izni kaldırıldı.`,
                    components: [],
                    ephemeral: true
                });
            }
        });
    }

    if (route === 'info') {

        if (!existingRoom) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        const channel = interaction.guild.channels.cache.get(existingRoom.channel);
        if (!channel) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        const container = new ContainerBuilder();

        const title = new TextDisplayBuilder().setContent('# Kullanıcı Bilgileri')
        container.addTextDisplayComponents(title);

        const section = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                [
                    `→ Oda Sahibi: <@${existingRoom.owner}>`,
                    `→ Oda Adı: ${channel.name}`,
                    `→ Oda Limiti: ${channel.userLimit || 'Sınırsız'}`,
                    `→ Oda Kanalı: <#${channel.id}>`,
                    `→ Oda Oluşturulma Tarihi: ${new Date(existingRoom.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' })}`,
                    `→ Oda Süresi: ${existingRoom.endDate ? `${Math.ceil((existingRoom.endDate - Date.now()) / (1000 * 60 * 60 * 24))} gün` : 'Sınırsız'}`,
                ].join('\n')
            ))
            .setThumbnailAccessory(new ThumbnailBuilder().setURL(member.displayAvatarURL({ dynamic: true, size: 4096 })))

        container.addSectionComponents(section);
        container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

        const allowedUsers = channel.permissionOverwrites.cache.filter(overwrite =>
            overwrite.allow.has(PermissionFlagsBits.Connect) && overwrite.type === 1
        );

        if (allowedUsers.size > 0) {
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent([
                `### İzinli Kullanıcılar (${allowedUsers.size})`,
                allowedUsers.map(user => `<@${user.id}>`).join(' ')
            ].join('\n')));
            container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));
        }

        const nameButton = new ButtonBuilder({
            customId: 'loca:edit',
            label: 'Loca Düzenle',
            style: ButtonStyle.Secondary,
        })

        const limitButton = new ButtonBuilder({
            customId: 'loca:limit',
            label: 'Loca Limitini Ayarla',
            style: ButtonStyle.Secondary,
        })

        const lockButton = new ButtonBuilder({
            customId: 'loca:lock',
            label: 'Loca Kilitle/Aç',
            style: ButtonStyle.Secondary,
        })

        container.addActionRowComponents(row => row.addComponents(nameButton, limitButton, lockButton));

        await interaction.reply({
            components: [container],
            flags: [
                MessageFlags.IsComponentsV2
            ],
            allowedMentions: { parse: [] },
            ephemeral: true
        });
    }

    if (route === 'coinControl') {

        const document = await UserModel.findOne({ id: member.id })
        if (!document) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder({
                        title: 'Hata!',
                        image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                        description: 'Kullanıcı verisi bulunamadı. Lütfen tekrar deneyiniz.',
                    })
                ], ephemeral: true
            });
        }

        const coin = document?.monarchCoin || 0

        interaction.reply({ content: `${bold(coin)} Monarch Coin'iniz bulunuyor.`, ephemeral: true })
    }

    if (route === 'coinTable') {
        interaction.reply({
            embeds: [
                new EmbedBuilder({
                    description: [
                        '# **MCoin Tablosu 💰**',
                        '',
                        'Merhaba! 🎉 Özel odalarınızı daha keyifli hale getirmek için Monarch coins paketlerimizi sunuyoruz. İşte mevcut paketlerimiz ve indirimli fiyatları:',
                        '',
                        '- **1500 MCoin**: ~~69.99 TL~~ **34.99 TL**',
                        '- **3000 MCoin**: ~~159.99 TL~~ **79.99 TL**',
                        '- **5000 MCoin**: ~~239.99 TL~~ **119.99 TL**',
                        '- **15000 MCoin**: ~~699.99 TL~~ **349.99 TL**',
                        '',
                        'Daha fazla Monarch coins ile özel odalarınızı daha fazla kişiselleştirebilir ve daha fazla avantaj elde edebilirsiniz. Unutmayın, indirimli fiyatlar sınırlı süre için geçerlidir! 🕒',
                        '',
                        "Monarch coins'lerinizi kazanmak için etkinliklere katılabilir veya sesli odalarda vakit geçirebilirsiniz.",
                        '',
                        'Eğer herhangi bir sorunuz olursa, bize her zaman ulaşabilirsiniz. İyi eğlenceler! 🚀'
                    ].join('\n')
                })
            ],
            ephemeral: true
        })
    }

    if (route === 'duration') {
        if (!existingRoom) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        const channel = interaction.guild.channels.cache.get(existingRoom.channel);
        if (!channel) return interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Loca Odası Bulunamadı!',
                    image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                    description: 'Loca odası bulunamadı. Lütfen önce bir loca odası oluşturunuz.',
                })
            ], ephemeral: true
        });

        let day = 0;

        if (interaction.values[0] === 'extendOneDay') day = 1;
        if (interaction.values[0] === 'extendSevenDay') day = 7;
        if (interaction.values[0] === 'extendThirtyDay') day = 30;

        if (day > 0) {
            const newEndDate = (existingRoom.endDate || Date.now()) + (day * 24 * 60 * 60 * 1000);

            await interaction.guild.updateSettings({
                $set: {
                    "locaRooms.$[elem].endDate": newEndDate
                }
            }, {
                arrayFilters: [{ "elem.owner": member.id }]
            });

            await UserModel.updateOne(
                { id: member.id },
                { $inc: { monarchCoin: day === 1 ? -1000 : day === 7 ? -5000 : -15000 } },
            );

            return interaction.reply({
                content: `Loca odanızın süresi başarıyla uzatıldı! Yeni süre: ${new Date(newEndDate).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' })}`,
                ephemeral: true
            });
        }
    }
}

async function createLocaRoom(question, interaction, days, ertu) {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const existingRoom = (ertu.locaRooms || []).find(x => x.owner === member.id);

    if (existingRoom) return interaction.reply({
        embeds: [
            new EmbedBuilder({
                title: 'Hata!',
                image: { url: 'https://tempvoice.xyz/embeds/discord/copyright-fail.png' },
                description: 'Zaten bir loca odası oluşturmuşsunuz. ',
            })
        ], ephemeral: true
    });

    const perms = [
        {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages]
        },
        {
            id: member.id,
            allow: [
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Stream,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages
            ]
        },
    ];

    ertu?.settings.womanRoles.forEach((role) => {
        if (interaction.guild.roles.cache.has(role)) {
            perms.push({
                id: role,
                allow: [PermissionFlagsBits.ViewChannel]
            });
        }
    });

    ertu?.settings.manRoles.forEach((role) => {
        if (interaction.guild.roles.cache.has(role)) {
            perms.push({
                id: role,
                allow: [PermissionFlagsBits.ViewChannel]
            });
        }
    });

    ertu?.settings.unregisterRoles.forEach((role) => {
        if (interaction.guild.roles.cache.has(role)) {
            perms.push({
                id: role,
                deny: [PermissionFlagsBits.ViewChannel]
            });
        }
    });

    const channel = await interaction.guild.channels.create({
        name: `${member.displayName}'nin Odası`,
        type: ChannelType.GuildVoice,
        parent: ertu.settings.locaParent,
        userLimit: 10,
        permissionOverwrites: perms
    });

    const endDate = Date.now() + (days * 24 * 60 * 60 * 1000);

    await interaction.guild?.updateSettings({
        $push: {
            locaRooms: {
                owner: member.id,
                channel: channel.id,
                createdAt: Date.now(),
                endDate: endDate,
            }
        }
    });

    await UserModel.updateOne(
        { id: member.id },
        { $inc: { monarchCoin: days === 1 ? -1000 : days === 7 ? -5000 : -15000 } },
    );

    question.edit({
        content: `Loca odası başarıyla oluşturuldu! Oda kanalı: <#${channel.id}>`,
        components: [],
        ephemeral: true
    });
}
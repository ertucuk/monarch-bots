const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    Name: 'loca',
    Aliases: ['loca'],
    Description: 'Sunucunun özel loca kullanımını gösterir.',
    Usage: 'loca',
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
        const loadingMsg = await message.channel.send('Loca paneli oluşturuluyor, lütfen bekleyin...');

        const image = await client.functions.generateLocaPanel();
        if (!image) return message.channel.send('Panel oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'loca:create',
                    label: 'Loca Oluştur',
                    style: ButtonStyle.Primary,
                }),
                new ButtonBuilder({
                    customId: 'loca:limit',
                    label: 'Loca Limitini Ayarla',
                    style: ButtonStyle.Primary,
                }),
                new ButtonBuilder({
                    customId: 'loca:edit',
                    label: 'Loca Düzenle',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    customId: 'loca:lock',
                    label: 'Loca Kilitle/Aç',
                    style: ButtonStyle.Secondary,
                })
            ],
        });

        const row2 = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'loca:addUser',
                    label: 'Kullanıcı Ekle',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    customId: 'loca:removeUser',
                    label: 'Kullanıcı Çıkar',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    customId: 'loca:info',
                    label: 'Loca Bilgi',
                    style: ButtonStyle.Secondary,
                })
            ],
        });

        const row3 = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'loca:coinControl',
                    label: 'Monarch Coin Kontrol Et',
                    style: ButtonStyle.Success,
                }),
                new ButtonBuilder({
                    customId: 'loca:coinTable',
                    label: 'Monarch Coin Tablosu',
                    style: ButtonStyle.Success,
                })
            ],
        });

        const row4 = new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    customId: 'loca:duration',
                    placeholder: 'Özel Loca Süresini Uzat',
                    options: [
                        {
                            label: 'Paketi 1 Gün Uzat',
                            description: '1000 💰',
                            value: 'extendOneDay',
                        },
                        {
                            label: 'Paketi 7 Gün Uzat',
                            description: '5000 💰',
                            value: 'extendSevenDay',
                        },
                        {
                            label: 'Paketi 30 Gün Uzat',
                            description: '15000 💰',
                            value: 'extendThirtyDay',
                        }
                    ]
                })
            ],
        });

        message.delete().catch(() => { });
        loadingMsg.delete().catch(() => { });

        await message.channel.send({
            files: [new AttachmentBuilder(image, { name: 'loca-panel.png' })],
            components: [row, row2, row3, row4]
        });
    },
};
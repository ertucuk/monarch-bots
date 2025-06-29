const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, bold, inlineCode, codeBlock, time, EmbedBuilder, userMention, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PunitiveModel } = require('../../../../../Global/Settings/Schemas');
const ms = require('ms')
const moment = require('moment');
moment.locale('tr');
const titles = {
    'ForceBan': 'Kalıcı Yasaklama',
    'Ban': 'Yasaklama',
    'Quarantine': 'Karantina',
    'Ads': 'Reklam',
    'ChatMute': 'Metin Susturma',
    'VoiceMute': 'Ses Susturma',
    'Underworld': 'Underworld',
    'Warn': 'Uyarılma',
    'Event': 'Etkinlik Ceza',
    'Streamer': 'Streamer Ceza'
};

module.exports = async function Punish(client, interaction, route, ertu) {
    const member = interaction.guild?.members.cache.get(interaction.user.id);

    const embed = new EmbedBuilder({
        color: client.getColor('random'),
        author: {
            name: member?.user.username || 'Bilinmeyen',
            icon_url: member?.user.displayAvatarURL({ extension: 'png', size: 4096 })
        }
    });

    if (route === 'list') {
        await interaction.deferReply({ ephemeral: true });
        const document = await PunitiveModel.find({ user: member.id, active: true });
        if (document.length === 0) return interaction.editReply({ content: 'Siciliniz bulunmamakta.', ephemeral: true });

        const selectMenu = new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'member-document',
                    placeholder: `Herhangi bir ceza seçilmemiş! (${document.length} ceza)`,
                    options: document.slice(0, 25).map((x) => {
                        return {
                            label: `${titles[x.type]} (#${x.id})`,
                            description: 'Daha fazla bilgi için tıkla!',
                            value: x.id.toString(),
                        };
                    }),
                }),
            ],
        });

        const rows = [selectMenu];
        let page = 1;
        const totalData = Math.ceil(document.length / 25);

        if (document.length > 25) rows.push(client.getButton(page, totalData));

        const question = await interaction.editReply({
            embeds: [
                embed.setDescription(`Toplamda ${document.length} ceza bulunmakta.`).addFields([
                    {
                        name: 'Metin Susturma',
                        value: document.filter((p) => p.type === 'ChatMute').length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Ses Susturma',
                        value: document.filter((p) => p.type === 'VoiceMute').length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Karantina',
                        value: document.filter((p) => p.type === 'Quarantine').length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Yasaklama',
                        value: document.filter((p) => p.type === 'Ban').length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Underworld',
                        value: document.filter((p) => p.type === 'Underworld').length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Reklam',
                        value: document.filter((p) => p.type === 'Ads').length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Uyarılma',
                        value: document.filter((p) => p.type === 'Warn').length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Etkinlik Ceza',
                        value: document.filter((p) => p.type === 'Event').length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Public Ceza',
                        value: document.filter((p) => p.type === 'Public').length.toString(),
                        inline: true,
                    },
                    {
                        name: 'Streamer Ceza',
                        value: document.filter((p) => p.type === 'Streamer').length.toString(),
                        inline: true,
                    }
                ])
            ],
            components: rows
        });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = question.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.isStringSelectMenu()) {
                const penal = document.find((p) => p.id.toString() === i.values[0]);
                if (!penal) return i.reply({ content: 'Belirtilen ceza bulunamadı.', ephemeral: true });

                const image = client.functions.getImage(penal?.reason || '');

                const fields = [];
                fields.push({
                    name: `Ceza Detayı (${titles[penal.type]})`,
                    value: [
                        `${bold(inlineCode(' > '))} Üye Bilgisi: ${userMention(penal.user)} (${inlineCode(penal.user)})`,
                        `${bold(inlineCode(' > '))} Yetkili Bilgisi: ${userMention(penal.staff)} (${inlineCode(penal.staff)})`,
                        `${bold(inlineCode(' > '))} Ceza Tarihi: ${time(Math.floor(penal.createdTime.valueOf() / 1000), 'D')}`,
                        `${bold(inlineCode(' > '))} Ceza Süresi: ${penal.finishedTime ? moment.duration(penal.finishedTime - penal.createdTime).humanize() : 'Süresiz.'}`,
                        `${bold(inlineCode(' > '))} Ceza Durumu: ${inlineCode(penal.active ? 'Aktif ✔' : 'Aktif Değil ❌')}`,
                    ].join('\n'),
                    inline: false,
                });

                if (penal.remover && penal.removedTime) {
                    fields.push({
                        name: 'Ceza Kaldırılma Detayı',
                        value: [
                            `${bold(inlineCode(' > '))} Kaldıran Yetkili: ${userMention(penal.remover)} (${inlineCode(penal.remover)})`,
                            `${bold(inlineCode(' > '))} Kaldırma Tarihi: ${time(Math.floor(penal.removedTime.valueOf() / 1000), 'D')}`,
                            `${bold(inlineCode(' > '))} Kaldırılma Sebebi: ${inlineCode(penal.removeReason || 'Sebep belirtilmemiş.')}`,
                        ].join('\n'),
                        inline: false,
                    });
                };

                const replacedReason = image ? 'Sebep belirtilmemiş.' : penal.reason;

                if (replacedReason.length) {
                    fields.push({
                        name: 'Ceza Sebebi',
                        value: codeBlock('fix', replacedReason),
                        inline: false,
                    });
                };

                return i.reply({
                    embeds: [
                        embed
                            .setFields(fields)
                            .setDescription(null)
                            .setImage(image ? image : penal.image ? 'attachment://ertu-baba.png' : null),
                    ],

                    files: image ? [] : penal.image ? [penal.image] : [],
                    ephemeral: true,
                });

            } else if (i.isButton()) {
                i.deferUpdate();

                if (i.customId === 'first') page = 1;
                if (i.customId === 'previous') page -= 1;
                if (i.customId === 'next') page += 1;
                if (i.customId === 'last') page = totalData;

                interaction.editReply({
                    components: [
                        new ActionRowBuilder({
                            components: [
                                new StringSelectMenuBuilder({
                                    custom_id: 'penals',
                                    placeholder: `Herhangi bir ceza seçilmemiş! (${document.length} ceza)`,
                                    options: document.slice(page === 1 ? 0 : page * 25 - 25, page * 25).map((penal) => {
                                        return {
                                            label: `${titles[penal.type]} (#${penal.id})`,
                                            description: 'Daha fazla bilgi için tıkla!',
                                            value: `${penal.id}`,
                                        };
                                    }),
                                }),
                            ],
                        }),
                        client.getButton(page, totalData),
                    ],
                });
            }
        });
    }

    if (route === 'last') {
        const documents = await PunitiveModel.find({
            user: member.id,
            active: true,
            visible: true,
        });

        if (!documents.length) return interaction.reply({ content: 'Aktif bir cezanız bulunmamakta.', ephemeral: true });

        const now = Date.now()
        const data = [];

        for (const document of documents) {
            const remainingTime = document.finishedTime
                ? moment.duration(document.finishedTime - now).humanize()
                : 'Süresiz.';
            const exactTime = document.finishedTime
                ? `${Math.floor((document.finishedTime - now) / 60000)} dakika sonra`
                : 'Süresiz.';

            data.push(codeBlock('yaml', [
                `# ${titles[document.type] || 'Bilinmiyor'}`,
                `→ Yetkili: ${member.guild.members.cache.get(document.staff)?.user.username || 'Bilinmiyor'}`,
                `→ Sebep: ${document.reason}`,
                `→ Tarih: ${client.functions.date(document.createdTime)}`,
                `→ Bitiş: ${remainingTime} (${exactTime})`,
            ].join('\n')));
        };

        interaction.reply({
            ephemeral: true,
            embeds: [
                embed.setDescription(`Toplamda ${documents.length} aktif cezanız bulunmaktadır.\n\n${data.join('\n\n')}`)
            ]
        });
    }

    if (route === 'complaint') {
        await interaction.deferReply({ ephemeral: true });

        const document = await PunitiveModel.find({ user: member.id, active: true });
        if (document.length === 0) return interaction.editReply({ content: 'Şikayet edebileceğiniz bir ceza bulunmamakta.' });

        const limit = client.functions.checkLimit(interaction, interaction.user.id, 'Complaint', 1, ms('1h'));
        if (limit.hasLimit) return interaction.editReply({ content: `Bir sonraki itirazını ${limit.time} edebilirsin.` });

        const selectMenu = new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'complaint',
                    placeholder: 'Şikayet edebileceğiniz bir ceza seçin!',
                    options: document.map((x) => {
                        return {
                            label: `${titles[x.type]} (#${x.id})`,
                            value: x.id.toString(),
                        };
                    }),
                }),
            ],
        });

        const question = await interaction.editReply({
            content: 'Şikayet edebileceğiniz bir ceza seçin!',
            components: [selectMenu],
        });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = question.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (i) => {
            const penal = document.find((p) => p.id.toString() === i.values[0]);
            if (!penal) return i.reply({ content: 'Belirtilen ceza bulunamadı.', ephemeral: true });

            const modal = new ModalBuilder({
                custom_id: 'complaintModal',
                title: 'Şikayet Formu',
                components: [
                    new ActionRowBuilder({
                        components: [
                            new TextInputBuilder({
                                custom_id: 'complaint',
                                label: 'Şikayetinizi belirtin!',
                                placeholder: 'Şikayetinizi detaylı bir şekilde yazınız.',
                                style: TextInputStyle.Paragraph,
                                required: true,
                            }),
                        ]
                    }),
                ]
            });

            await i.showModal(modal);

            try {
                const modalCollected = await i.awaitModalSubmit({ time: 1000 * 60 * 2 });
                const value = modalCollected.fields.getTextInputValue('complaint')

                await modalCollected.reply({
                    content: 'Şikayetiniz başarıyla alındı.\n**Not: Boşa atılan şikayetler ceza almanıza sebep olabilir.**',
                    ephemeral: true,
                });

                const roles = member.guild.roles.cache.filter((role) => role.name.includes('Ban/Jail')).map(role => `<@&${role.id}>`).join(', ');

                const log = await client.getChannel(client.data.logs.complaint, interaction);
                if (log) {
                    log.send({
                        content: roles || null,
                        embeds: [
                            embed.setDescription([
                                `${bold(inlineCode(' > '))} Kullanıcı: ${userMention(interaction.user.id)}`,
                                `${bold(inlineCode(' > '))} Şikayet Edilen Ceza: ${titles[penal.type]} (#${penal.id})`,
                                `${bold(inlineCode(' > '))} Ceza Sebebi: ${penal.reason}`,
                                `${bold(inlineCode(' > '))} Şikayet:`,
                                codeBlock('fix', value),
                            ].join('\n')),
                        ],
                        components: [
                            new ActionRowBuilder({
                                components: [
                                    new ButtonBuilder({
                                        custom_id: 'punish:care',
                                        label: 'İlgileniyorum',
                                        style: ButtonStyle.Secondary
                                    })
                                ]
                            })
                        ]
                    });
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    if (route === 'care') {
    const message = interaction.channel.messages.cache.get(interaction.message.id);
    if (!message) return;

    const description = message.embeds[0]?.description;
    const user = description && description.match(/<@!?(\d+)>/);
    const complainUserId = user ? user[1] : null;

    if (complainUserId) {
        const complainUser = await interaction.client.users.fetch(complainUserId).catch(() => null);
        if (complainUser) {
            complainUser.send({ content: `Şikayetiniz ile ${interaction.user} ilgileniyor. Yakında size dönüş yapılacaktır.` }).catch(() => null);
        }
    }

    message.edit({
        content: `${interaction.user} şikayetle ilgileniyor.`,
        components: message.components.map(row =>
            new ActionRowBuilder().addComponents(
                row.components.map(component => {
                    if (component.type === 2) {
                        return new ButtonBuilder().setCustomId('complaint:care').setLabel(`${interaction.user.username} İlgileniyor`).setStyle(ButtonStyle.Success).setDisabled(true);
                    }
                    return component;
                })
            )
        )
    });

    interaction.reply({ content: 'İşlem başarılı!', ephemeral: true });
}
}
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { StaffModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Excuse(client, interaction, route, ertu) {

    const member = interaction.guild.members.cache.get(interaction.user.id);
    if (!member) return;

    if (route === 'send') {
        const document = await StaffModel.findOne({ user: member.id });
        if (!document) {
            await StaffModel.create({ user: member.id, excuses: [] });
        }

        const control = document?.excuses.find(x => x.active === true);
        if (control) return interaction.reply({ content: 'Zaten aktif bir mazeret başvurunuz var.', ephemeral: true });

        const modal = new ModalBuilder({
            custom_id: 'excuse:modal',
            title: 'Mazeret Başvuru Paneli',
            components: [
                new ActionRowBuilder({
                    components: [
                        new TextInputBuilder({
                            customId: 'excuse',
                            label: 'Mazeretiniz nedir?',
                            style: TextInputStyle.Paragraph,
                            placeholder: 'Mazeretinizi buraya yazabilirsiniz.',
                            required: true,
                        })
                    ]
                })
            ]
        });

        await interaction.showModal(modal);

        const modalCollected = await interaction.awaitModalSubmit({ time: 1000 * 60 * 3 });
        const excuse = modalCollected.fields.getTextInputValue('excuse');

        if (modalCollected) {
            const logChannel = await client.getChannel(client.data.logs.excuse, interaction)
            if (!logChannel) return;

            const embed = new EmbedBuilder({
                title: 'Mazeret Başvurusu Onaylandı',
                description: `**Mazeret:** __${excuse}__`,
                fields: [
                    {
                        name: 'Başvuru Yapan Yetkili',
                        value: `${member}`,
                        inline: true
                    },
                    {
                        name: 'Başvuru Tarihi',
                        value: `${client.timestamp(Date.now())}`,
                        inline: true
                    }
                ]
            })

            const row = new ActionRowBuilder({
                components: [
                    new ButtonBuilder({
                        customId: 'excuse:meeting',
                        label: 'Toplantı Mazeret',
                        style: ButtonStyle.Primary
                    }),

                    new ButtonBuilder({
                        customId: 'excuse:individual',
                        label: 'Bireysel Mazeret',
                        style: ButtonStyle.Primary
                    }),

                    new ButtonBuilder({
                        customId: 'excuse:general',
                        label: 'Genel Mazeret',
                        style: ButtonStyle.Primary
                    }),

                    new ButtonBuilder({
                        customId: 'excuse:reject',
                        label: 'Mazereti Reddet',
                        style: ButtonStyle.Danger
                    })
                ]
            })

            const managementLeader = interaction.guild.roles.cache.find(x => x.name === '† Yönetim Lideri')
            const excuseLeader = interaction.guild.roles.cache.find(x => x.name === '† Mazeret Lideri')

            const question = await logChannel.send({
                content: `<@&${managementLeader?.id}> <@&${excuseLeader?.id}>`,
                embeds: [embed],
                components: [row]
            });

            await StaffModel.updateOne({ user: member.id }, {
                $push: {
                    excuses: {
                        startAt: Date.now(),
                        active: true,
                        reason: excuse,
                        messageId: question
                    }
                }
            }).catch(() => { });

            await modalCollected.reply({ content: 'Mazeret başvurunuz iletildi.', ephemeral: true });
        }
    }

    if (route === 'meeting') {
        const today = new Date();
        const isFriday = today.getDay() === 5;
        if (!isFriday) return interaction.reply({ content: 'Toplantı mazereti sadece Cuma günü kullanılabilir.', ephemeral: true });

        const document = await StaffModel.find({ excuses: { $elemMatch: { messageId: interaction.message.id, active: true } } });
        if (!document) return interaction.reply({ content: 'Bu mazeret başvurusunu bulamadım.', ephemeral: true });

        const member = interaction.guild.members.cache.get(document[0].user);
        if (!member) return interaction.reply({ content: 'Bu mazeret başvurusunu bulamadım.', ephemeral: true });

        const meetingExcuseRole = interaction.guild.roles.cache.find(x => x.name === '† Toplantı Mazeret');
        if (member.roles.cache.has(meetingExcuseRole.id)) return interaction.reply({ content: 'Bu kullanıcı zaten genel mazeret rolüne sahip.', ephemeral: true });

        await StaffModel.updateOne({ user: member.id, 'excuses.messageId': interaction.message.id }, {
            $set: {
                'excuses.$.staff': interaction.user.id,
                'excuses.$.active': false,
                'excuses.$.type': 'meeting',
            }
        }).catch(() => { });

        await interaction.reply({ content: 'Toplantı mazereti olarak kaydedildi.', ephemeral: true });

        const embed = new EmbedBuilder({
            title: 'Mazeret Başvurusu Onaylandı',
            description: `**Mazeret:** __${document[0].excuses.find(x => x.messageId === interaction.message.id).reason}__`,
            fields: [
                {
                    name: 'Başvuru Yapan Yetkili',
                    value: `${member}`,
                    inline: true
                },
                {
                    name: 'Başvuru Tarihi',
                    value: `${client.timestamp(Date.now())}`,
                    inline: true
                },
                {
                    name: 'Mazeret Türü',
                    value: 'Toplantı Mazereti',
                    inline: true
                },
                {
                    name: 'Onaylayan Yetkili',
                    value: `${interaction.user}`,
                    inline: true
                },
                {
                    name: 'Onay Tarihi',
                    value: `${client.timestamp(Date.now())}`,
                    inline: true
                }
            ]
        })

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'excuse:meeting',
                    label: 'Toplantı Mazeret',
                    style: ButtonStyle.Primary,
                    disabled: true
                }),

                new ButtonBuilder({
                    customId: 'excuse:individual',
                    label: 'Bireysel Mazeret',
                    style: ButtonStyle.Primary,
                    disabled: true
                }),

                new ButtonBuilder({
                    customId: 'excuse:general',
                    label: 'Genel Mazeret',
                    style: ButtonStyle.Primary,
                    disabled: true
                }),

                new ButtonBuilder({
                    customId: 'excuse:reject',
                    label: 'Mazereti Reddet',
                    style: ButtonStyle.Danger,
                    disabled: true
                })
            ]
        })

        interaction.message.edit({
            embeds: [embed],
            components: [row]
        }).catch(() => { });
    }

    if (route === 'individual') {
        const document = await StaffModel.find({ excuses: { $elemMatch: { messageId: interaction.message.id, active: true } } });
        if (!document) return interaction.reply({ content: 'Bu mazeret başvurusunu bulamadım.', ephemeral: true });

        const member = interaction.guild.members.cache.get(document[0].user);
        if (!member) return interaction.reply({ content: 'Bu mazeret başvurusunu bulamadım.', ephemeral: true });

        const individualExcuseRole = interaction.guild.roles.cache.find(x => x.name === '† Bireysel 🗸');
        if (member.roles.cache.has(individualExcuseRole.id)) return interaction.reply({ content: 'Bu kullanıcı zaten genel mazeret rolüne sahip.', ephemeral: true });

        await StaffModel.updateOne({ user: member.id, 'excuses.messageId': interaction.message.id }, {
            $set: {
                'excuses.$.staff': interaction.user.id,
                'excuses.$.active': false,
                'excuses.$.type': 'individual',
            }
        }).catch(() => { });

        await interaction.reply({ content: 'Bireysel mazeret olarak kaydedildi.', ephemeral: true });

        const embed = new EmbedBuilder({
            title: 'Mazeret Başvurusu Onaylandı',
            description: `**Mazeret:** __${document[0].excuses.find(x => x.messageId === interaction.message.id).reason}__`,
            fields: [
                {
                    name: 'Başvuru Yapan Yetkili',
                    value: `${member}`,
                    inline: true
                },
                {
                    name: 'Başvuru Tarihi',
                    value: `${client.timestamp(Date.now())}`,
                    inline: true
                },
                {
                    name: 'Mazeret Türü',
                    value: 'Bireysel Mazeret',
                    inline: true
                },
                {
                    name: 'Onaylayan Yetkili',
                    value: `${interaction.user}`,
                    inline: true
                },
                {
                    name: 'Onay Tarihi',
                    value: `${client.timestamp(Date.now())}`,
                    inline: true
                }
            ]
        })

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'excuse:meeting',
                    label: 'Toplantı Mazeret',
                    style: ButtonStyle.Primary,
                    disabled: true
                }),

                new ButtonBuilder({
                    customId: 'excuse:individual',
                    label: 'Bireysel Mazeret',
                    style: ButtonStyle.Primary,
                    disabled: true
                }),

                new ButtonBuilder({
                    customId: 'excuse:general',
                    label: 'Genel Mazeret',
                    style: ButtonStyle.Primary,
                    disabled: true
                }),

                new ButtonBuilder({
                    customId: 'excuse:reject',
                    label: 'Mazereti Reddet',
                    style: ButtonStyle.Danger,
                    disabled: true
                })
            ]
        })

        interaction.message.edit({
            embeds: [embed],
            components: [row]
        }).catch(() => { });
    }

    if (route === 'general') {
        const document = await StaffModel.find({ excuses: { $elemMatch: { messageId: interaction.message.id, active: true } } });
        if (!document) return interaction.reply({ content: 'Bu mazeret başvurusunu bulamadım.', ephemeral: true });

        const member = interaction.guild.members.cache.get(document[0].user);
        if (!member) return interaction.reply({ content: 'Bu mazeret başvurusunu bulamadım.', ephemeral: true });

        const generalExcuseRole = interaction.guild.roles.cache.find(x => x.name === '† Genel Mazeret');
        if (member.roles.cache.has(generalExcuseRole.id)) return interaction.reply({ content: 'Bu kullanıcı zaten genel mazeret rolüne sahip.', ephemeral: true });

        const modal = new ModalBuilder({
            custom_id: 'excuse:generalModal',
            title: 'Gün Belirtme Formu',
            components: [
                new ActionRowBuilder({
                    components: [
                        new TextInputBuilder({
                            customId: 'day',
                            label: 'Genel mazeret için gün belirtiniz.',
                            style: TextInputStyle.Short,
                            placeholder: '7',
                            required: true,
                        })
                    ]
                })
            ]
        });

        await interaction.showModal(modal);

        const modalCollected = await interaction.awaitModalSubmit({ time: 1000 * 60 * 2 });
        const day = modalCollected.fields.getTextInputValue('day');
        if (isNaN(day)) return modalCollected.reply({ content: 'Lütfen geçerli bir gün sayısı giriniz', ephemeral: true });

        if (modalCollected) {
            await StaffModel.updateOne({ user: member.id, 'excuses.messageId': interaction.message.id }, {
                $set: {
                    'excuses.$.staff': interaction.user.id,
                    'excuses.$.active': false,
                    'excuses.$.type': 'general',
                    'excuses.$.endAt': Date.now() + (day * 24 * 60 * 60 * 1000)
                }
            }).catch(() => { });

            await modalCollected.reply({ content: 'Genel mazeret olarak kaydedildi.', ephemeral: true });

            const embed = new EmbedBuilder({
                description: `**Mazeret:** __${document[0].excuses.find(x => x.messageId === interaction.message.id).reason}__`,
                fields: [
                    {
                        name: 'Başvuru Yapan Yetkili',
                        value: `${member}`,
                        inline: true
                    },
                    {
                        name: 'Başvuru Tarihi',
                        value: `${client.timestamp(Date.now())}`,
                        inline: true
                    },
                    {
                        name: 'Mazeret Türü',
                        value: 'Genel Mazeret',
                        inline: true
                    },
                    {
                        name: 'Mazeret Süresi',
                        value: `${day} gün`,
                        inline: true
                    },
                    {
                        name: 'Onaylayan Yetkili',
                        value: `${interaction.user}`,
                        inline: true
                    },
                    {
                        name: 'Onay Tarihi',
                        value: `${client.timestamp(Date.now())}`,
                        inline: true
                    }
                ]
            })

            const row = new ActionRowBuilder({
                components: [
                    new ButtonBuilder({
                        customId: 'excuse:meeting',
                        label: 'Toplantı Mazeret',
                        style: ButtonStyle.Primary,
                        disabled: true
                    }),

                    new ButtonBuilder({
                        customId: 'excuse:individual',
                        label: 'Bireysel Mazeret',
                        style: ButtonStyle.Primary,
                        disabled: true
                    }),

                    new ButtonBuilder({
                        customId: 'excuse:general',
                        label: 'Genel Mazeret',
                        style: ButtonStyle.Primary,
                        disabled: true
                    }),

                    new ButtonBuilder({
                        customId: 'excuse:reject',
                        label: 'Mazereti Reddet',
                        style: ButtonStyle.Danger,
                        disabled: true
                    })
                ]
            })

            interaction.message.edit({
                embeds: [embed],
                components: [row]
            }).catch(() => { });
        }
    }

    if (route === 'reject') {
        const document = await StaffModel.find({ excuses: { $elemMatch: { messageId: interaction.message.id, active: true } } });
        if (!document) return interaction.reply({ content: 'Bu mazeret başvurusunu bulamadım.', ephemeral: true });

        const member = interaction.guild.members.cache.get(document[0].user);
        if (!member) return interaction.reply({ content: 'Bu mazeret başvurusunu bulamadım.', ephemeral: true });

        await StaffModel.updateOne({ user: member.id, 'excuses.messageId': interaction.message.id }, {
            $pull : {
                excuses: {
                    messageId: interaction.message.id,
                    active: true
                }
            }
        }).catch(() => { });

        const embed = new EmbedBuilder({
            title: 'Mazeret Başvurusu Reddedildi',
            description: `**Mazeret:** __${document[0].excuses.find(x => x.messageId === interaction.message.id).reason}__`,
            fields: [
                {
                    name: 'Başvuru Yapan Yetkili',
                    value: `${member}`,
                    inline: true
                },
                {
                    name: 'Başvuru Tarihi',
                    value: `${client.timestamp(Date.now())}`,
                    inline: true
                },
                {
                    name: 'Reddeden Yetkili',
                    value: `${interaction.user}`,
                    inline: true
                },
            ]
        })

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'excuse:meeting',
                    label: 'Toplantı Mazeret',
                    style: ButtonStyle.Primary,
                    disabled: true
                }),

                new ButtonBuilder({
                    customId: 'excuse:individual',
                    label: 'Bireysel Mazeret',
                    style: ButtonStyle.Primary,
                    disabled: true
                }),

                new ButtonBuilder({
                    customId: 'excuse:general',
                    label: 'Genel Mazeret',
                    style: ButtonStyle.Primary,
                    disabled: true
                }),

                new ButtonBuilder({
                    customId: 'excuse:reject',
                    label: 'Mazereti Reddet',
                    style: ButtonStyle.Danger,
                    disabled: true
                })
            ]
        })

        interaction.message.edit({
            embeds: [embed],
            components: [row]
        }).catch(() => { });

        await interaction.reply({ content: 'Mazeret başvurusu reddedildi.', ephemeral: true });
    }
}
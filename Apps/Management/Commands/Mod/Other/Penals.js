const { PermissionsBitField: { Flags }, ActionRowBuilder, StringSelectMenuBuilder, inlineCode, bold, userMention, time, codeBlock } = require('discord.js');
const { PunitiveModel } = require('../../../../../Global/Settings/Schemas/')
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
    'Streamer': 'Streamer Ceza',
    'Public': 'Public Ceza',
};

module.exports = {
    Name: 'sicil',
    Aliases: ['cezalar'],
    Description: 'Sunucudaki bir üyenin ceza geçmişini gösterir.',
    Usage: 'sicil <@User/ID>',
    Category: 'Moderation',
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
            client.embed(message, 'Kullanıcı bulunamadı!')
            return;
        }

        const document = await PunitiveModel.find({ user: member.id, visible: true });
        if (!document || !document.length) {
            client.embed(message, 'Bu kullanıcının ceza geçmişi bulunmamaktadır.')
            return;
        }

        const row = new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'document',
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


        let components = [row];
        let page = 1;
        const totalData = Math.ceil(document.length / 25);
        if (document.length > 25) components.push(client.getButton(page, totalData));

        const msg = await message.reply({
            embeds: [embed.setDescription(`${member} (${inlineCode(member.id)}) adlı kullanıcının cezaları;`).setFields([
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
                    name: 'Jail',
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
            ])],

            components: components
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
        });

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
                            .setImage(image ? image : penal.image ? 'attachment://ertubab.png' : null),
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

                msg.edit({
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
    },
};
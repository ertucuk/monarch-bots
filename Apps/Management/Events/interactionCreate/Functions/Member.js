const { EmbedBuilder, time, codeBlock, bold, inlineCode, userMention, ActionRowBuilder, StringSelectMenuBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, AttachmentBuilder } = require('discord.js');
const { UserModel, PunitiveModel } = require('../../../../../Global/Settings/Schemas');
const moment = require('moment')
moment.locale('tr');
const inviteRegex = /\b(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discordapp\.com\/invite)\/([a-zA-Z0-9\-]{2,32})\b/;
const adsRegex = /([^a-zA-ZIıİiÜüĞğŞşÖöÇç\s])+/gi;

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

module.exports = async function MemberPanel(client, interaction, route, ertu) {
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) return interaction.reply({ content: 'Bir hata oluştu.', ephemeral: true });

    const embed = new EmbedBuilder({
        color: client.getColor('random'),
        author: {
            name: member?.user.username || 'Bilinmeyen',
            icon_url: member?.user.displayAvatarURL({ extension: 'png', size: 4096 })
        }
    });

    if (route === 'I') {
        return interaction.reply({
            ephemeral: true,
            embeds: [
                embed.setDescription(`Sunucuya katılma tarihiniz: ${time(Math.floor(member.joinedTimestamp / 1000))} (${time(Math.floor(member.joinedTimestamp / 1000), 'R',)})`)
            ]
        })
    };

    if (route === 'II') {
        return interaction.reply({
            ephemeral: true,
            embeds: [
                embed.setDescription(`Hesabınızın oluşturulma tarihi: ${time(Math.floor(member.user.createdTimestamp / 1000))} (${time(Math.floor(member.user.createdTimestamp / 1000), 'R',)})`)
            ],
        });
    };

    if (route == 'III') {
        return interaction.reply({
            ephemeral: true,
            embeds: [
                embed.setDescription(`Üstünüzde bulunan roller: ${member.roles.cache.filter((r) => r.id !== member.guild.id).map(r => r.toString()).listArray() || 'Yok'}`)
            ]
        });
    };

    if (route == 'IV') {
        const document = await UserModel.findOne({ id: member.id });
        if (!document) return interaction.reply({ content: 'Bir hata oluştu.', ephemeral: true });

        const invited = await UserModel.find({ inviter: member.id });
        const daily = invited.filter((i) =>
            interaction.guild?.members.cache.has(i.id) &&
            1000 * 60 * 60 * 24 >= (Date.now() - (interaction.guild?.members.cache.get(i.id)?.joinedTimestamp))
        );

        const weekly = invited.filter((i) =>
            interaction.guild?.members.cache.has(i.id) &&
            1000 * 60 * 60 * 24 * 7 >= (Date.now() - (interaction.guild?.members.cache.get(i.id)?.joinedTimestamp))
        );

        const monthly = invited.filter((i) =>
            interaction.guild?.members.cache.has(i.id) &&
            1000 * 60 * 60 * 24 * 30 >= (Date.now() - (interaction.guild?.members.cache.get(i.id)?.joinedTimestamp))
        );

        return interaction.reply({
            ephemeral: true,
            embeds: [
                embed.setDescription(`Merhaba sunucuda toplamda ${bold(((document.invitesData.normal || 0) + (document.invitesData.suspect || 0)).toString())} kişi davet etmişsin.`)
                    .addFields(
                        {
                            name: 'Günlük Davetler',
                            value: codeBlock('fix', daily.length.toString()),
                            inline: true
                        },
                        {
                            name: 'Haftalık Davetler',
                            value: codeBlock('fix', weekly.length.toString()),
                            inline: true
                        },
                        {
                            name: 'Aylık Davetler',
                            value: codeBlock('fix', monthly.length.toString()),
                            inline: true
                        },
                        {
                            name: 'Davet Ettiği Kişiler',
                            value: codeBlock('yaml', invited.slice(0, 10).map((i) => {
                                const m = interaction.guild?.members.cache.get(i.id);
                                if (!m) return;
                                return `→ ${m.displayName} [${m.user.username}]`
                            }).join('\n') || 'Bulunamadı')
                        }
                    )
            ]
        });
    };

    if (route == 'V') {
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
                            .setImage(image ? image : penal.image ? 'attachment://ertu.png' : null),
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

    if (route == 'VI') {
        if (!member.premiumSince) return interaction.reply({ content: 'Bu butonu kullanabilmek için sunucumuza boost basmalısınız.', ephemeral: true });

        const row = new ActionRowBuilder({
            components: [
                new TextInputBuilder({
                    custom_id: 'name',
                    label: 'İsim:',
                    max_length: 30,
                    style: TextInputStyle.Short,
                    placeholder: 'Ertuğrul Karahanlı',
                    required: true,
                })
            ]
        });

        const modal = new ModalBuilder({ custom_id: 'modal', components: [row], title: 'Booster İsim Değiştirme' });

        await interaction.showModal(modal);
        const modalCollected = await interaction.awaitModalSubmit({ time: 1000 * 60 * 2 });
        if (!modalCollected) return interaction.reply({ content: 'İşlem süresi doldu.', ephemeral: true });

        const name = modalCollected.fields.getTextInputValue('name');
        if (!name.length) return interaction.reply({ content: 'Geçerli bir isim belirt!', ephemeral: true });

        if (name.match(adsRegex)) return modalCollected.reply({ content: 'Belirttiğin kullanıcı adında reklam içeren özel harfler bulunmamalı!', ephemeral: true });
        if (name.match(inviteRegex)) return modalCollected.reply({ content: 'Belirttiğin kullanıcı adında özel harflerin bulunmaması gerekiyor!', ephemeral: true });

        const limit = client.functions.checkLimit(interaction, interaction.user.id, 'Booster', 1);
        if (limit.hasLimit) return modalCollected.reply({ content: `Bu butonu tekrar kullanabilmek için ${limit.time} beklemelisin!`, ephemeral: true });

        let newName = `${member.tag()} ${name}`;
        if (newName.length > 30) return modalCollected.reply({ content: 'Belirttiğin kullanıcı adı çok uzun!', ephemeral: true });

        member.setNickname(newName).catch(() => null);
        modalCollected.reply({ content: `İsmin başarıyla ${inlineCode(newName)} olarak değiştirildi.`, ephemeral: true });
    }

    if (route == 'VII') {
        const document = await UserModel.findOne({ id: member.id });

        if (!document || !document.nameLogs.length) return interaction.reply({ content: 'İsim bilginiz bulunamadı.', ephemeral: true });

        const mapped = document.nameLogs.reverse().slice(0, 10).map((log) => {
            return `- [${client.timestamp(log.date)}] ${inlineCode(` ${log.name} `)} (${bold(log.type)}) ${log.staff && member.guild.members.cache.has(log.staff) ? `${member.guild.members.cache.get(log.staff)}` : ''}`;
        });

        interaction.reply({
            ephemeral: true,
            embeds: [
                embed.setDescription(`Toplamda ${document.nameLogs.length} eski isminiz bulunmaktadır. En son 10 ismi aşağıda listelenmiştir.\n\n${mapped.join('\n')}`)
            ]
        });
    }

    if (route == 'VIII') {
        const document = await UserModel.findOne({ id: member.id });
        if (!document || !document.penalPoint) return interaction.reply({ content: 'Sicil puanınız bulunmamakta.', ephemeral: true });

        const penalPoint = document.penalPoint || 0;

        interaction.reply({
            ephemeral: true,
            embeds: [
                embed.setDescription([
                    `Merhaba ${member.displayName}, sunucuda toplamda ${bold(penalPoint.toString())} sicil puanınız bulunmakta.`,
                    '',
                    `Ceza Puan Barı: ${await client.functions.createBar(client, penalPoint, 250)} (${inlineCode(penalPoint.toString() + '/250')})`,
                    `Ceza Puan Durumu: ${inlineCode(penalPoint >= 250 ? 'Kötü' : penalPoint >= 100 ? 'Orta' : penalPoint >= 50 ? 'İyi' : 'Mükemmel')}`,
                    '',
                    `**Önemli Hatırlatma:** Eğer ceza puanınız **250** olursa sistem tarafından karantinaya atılırsınız.`
                ].join('\n'))
            ]
        });    
    }

    if (route == 'IX') {
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
}
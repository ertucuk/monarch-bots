const {
    EmbedBuilder,
    ComponentType,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    bold,
    ThumbnailBuilder,
    userMention,
    inlineCode,
    codeBlock,
    time,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    AttachmentBuilder,
} = require('discord.js');
const path = require('path')

const { PunitiveModel, UserModel } = require('../../../../Global/Settings/Schemas')
const { Canvas, loadImage } = require('canvas-constructor/skia');
const moment = require('moment');
moment.locale('tr')

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

module.exports = {
    Name: 'profil',
    Aliases: [],
    Description: 'Belirttiğiniz kişinin profil bilgilerini görürsünüz.',
    Usage: 'profil <@User/ID>',
    Category: 'Global',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!member) return client.embed(message, `Kullanıcı bulunamadı!`);

        const embed = new EmbedBuilder({
            color: client.getColor('random'),
            author: {
                name: member?.user?.username || 'Bilinmeyen',
                icon_url: member?.user?.displayAvatarURL({ extension: 'png', size: 4096 })
            }
        });

        const roleList = member.roles.cache
            .filter(role => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => `${role}`)
            .slice(0, 3)
            .join(', ') || 'Rol yok';

        const container = new ContainerBuilder();

        const title = new TextDisplayBuilder().setContent('# Kullanıcı Bilgileri')
        container.addTextDisplayComponents(title);

        const section = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            [
                `- Hesap: ${member}`,
                `- Hesap ID: ${bold(member.id)}`,
                `- Hesap Oluşturulma: ${client.timestamp(member.user.createdAt)}`,
            ].join('\n')
        ))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(member.displayAvatarURL({ dynamic: true, size: 4096 })))

        container.addSectionComponents(section);
        container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

        const section2 = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                [
                    `- Sunucudaki İsmi: ${bold(member.nickname || member.user.displayName)}`,
                    `- Katılma Tarihi: ${client.timestamp(member.joinedAt)}`,
                    `- Bazı Rolleri;`,
                    `➥ ${roleList}`,
                ].join('\n')
            ))
            .setButtonAccessory(
                new ButtonBuilder({
                    customId: 'penals',
                    label: 'Sicili Göster',
                    style: ButtonStyle.Secondary,
                })
            );

        container.addSectionComponents(section2);
        container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

        if (member.voice.channel) {
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent([
                    `- ${member.voice.channel} kanalında bulunuyor.`,
                    `- Mikrofon Durumu: ${(member.voice?.mute ? member.voice.selfMute ? await client.getEmoji('check') : await client.getEmoji('mark') : await client.getEmoji('check'))}`,
                    `- Kulaklık Durumu: ${(member.voice?.deaf ? member.voice.selfDeaf ? await client.getEmoji('check') : await client.getEmoji('mark') : await client.getEmoji('check'))}`,
                    `- Ekran Durumu: ${(member.voice?.streaming ? await client.getEmoji('check') : await client.getEmoji('mark'))}`,
                    `- Kamera Durumu: ${(member.voice?.selfVideo ? await client.getEmoji('check') : await client.getEmoji('mark'))}`,
                    `- Doluluk Durumu: ${(`${member?.voice?.channel?.members?.size}/${member?.voice?.channel?.userLimit || '∞'}`)}`,
                ].join('\n')
            ))

            container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));
        }

        const avatarButton = new ButtonBuilder()
            .setLabel('Avatarı Görüntüle')
            .setURL(member.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setStyle(ButtonStyle.Link);

        const bannerButton = new ButtonBuilder()
            .setLabel('Banneri Görüntüle')
            .setURL(await member.bannerURL({ dynamic: true, size: 4096 }))
            .setStyle(ButtonStyle.Link);

        const statsButton = new ButtonBuilder()
            .setCustomId('stats')
            .setLabel('İstatistikleri Görüntüle')
            .setStyle(ButtonStyle.Secondary);

        container.addActionRowComponents(row => row.addComponents(avatarButton, bannerButton, statsButton));

        const question = await message.channel.send({
            components: [container],
            flags: [
                MessageFlags.IsComponentsV2,
            ],
            allowedMentions: { parse: [] }
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'penals') {
                await interaction.deferReply({ ephemeral: true });
                const document = await PunitiveModel.find({ user: member.id, active: true });
                if (document.length === 0) return interaction.editReply({ content: 'Sicil bulunmamakta.', ephemeral: true });
        
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

            if (interaction.customId === 'stats') {
                const document = await UserModel.findOne({ id: member.id });
                if (!document) return interaction.reply({ content: 'Bir hata oluştu.', ephemeral: true });
        
                const voiceDays = document.voices || {};
                const messageDays = document.messages || {};
                const streamDays = document.streams || {};
                const cameraDays = document.cameras || {};
        
                const totalVoice = Object.keys(voiceDays).reduce((totalCount, currentDay) => totalCount + voiceDays[currentDay].total, 0);
                const totalMessage = Object.keys(messageDays).reduce((totalCount, currentDay) => totalCount + messageDays[currentDay].total, 0);
                const totalStream = Object.keys(streamDays).reduce((totalCount, currentDay) => totalCount + streamDays[currentDay].total, 0);
                const totalCamera = Object.keys(cameraDays).reduce((totalCount, currentDay) => totalCount + cameraDays[currentDay].total, 0);
        
                const dailyVoice = Object.keys(voiceDays).filter((d) => 1 >= document.day - Number(d)).reduce((totalCount, currentDay) => totalCount + voiceDays[currentDay].total, 0)
                const dailyMessage = Object.keys(messageDays).filter((d) => 1 >= document.day - Number(d)).reduce((totalCount, currentDay) => totalCount + messageDays[currentDay].total, 0)
                const dailyStream = Object.keys(streamDays).filter((d) => 1 >= document.day - Number(d)).reduce((totalCount, currentDay) => totalCount + streamDays[currentDay].total, 0)
                const dailyCamera = Object.keys(cameraDays).filter((d) => 1 >= document.day - Number(d)).reduce((totalCount, currentDay) => totalCount + cameraDays[currentDay].total, 0)
        
                const monthlyVoice = Object.keys(voiceDays).filter((d) => 30 >= document.day - Number(d)).reduce((totalCount, currentDay) => totalCount + voiceDays[currentDay].total, 0)
                const monthlyMessage = Object.keys(messageDays).filter((d) => 30 >= document.day - Number(d)).reduce((totalCount, currentDay) => totalCount + messageDays[currentDay].total, 0)
                const monthlyStream = Object.keys(streamDays).filter((d) => 30 >= document.day - Number(d)).reduce((totalCount, currentDay) => totalCount + streamDays[currentDay].total, 0)
                const monthlyCamera = Object.keys(cameraDays).filter((d) => 30 >= document.day - Number(d)).reduce((totalCount, currentDay) => totalCount + cameraDays[currentDay].total, 0)
        
                const canvas = new Canvas(1145, 337);
                const backgroundBuffer = await loadImage(path.resolve(__dirname, '../../../../Global/Assets/Images', 'weekly.png'));
                canvas.printImage(backgroundBuffer, 0, 0);
        
                const avatarBuffer = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 4096 }));
                canvas.printRoundedImage(avatarBuffer, 19, 18, 65, 65, 20);
        
                canvas.setTextFont('normal 25px Kanit');
                canvas.setColor('#ffffff');
                canvas.printText(member.user.displayName, 95, 60);
        
                canvas.setTextSize(20);
                canvas.setTextAlign('center');
                canvas.printText(`${document.day} günlük veri`, 995, 46);
        
                canvas.setTextSize(15);
        
                canvas.printText(client.functions.formatDurations(dailyVoice), 258, 143);
                canvas.printText(`${dailyMessage} mesaj`, 258, 195);
                canvas.printText(client.functions.formatDurations(dailyStream), 258, 243);
                canvas.printText(client.functions.formatDurations(dailyCamera), 258, 293);
        
                canvas.printText(client.functions.formatDurations(monthlyVoice), 639, 143);
                canvas.printText(`${monthlyMessage} mesaj`, 639, 195);
                canvas.printText(client.functions.formatDurations(monthlyStream), 639, 243);
                canvas.printText(client.functions.formatDurations(monthlyCamera), 639, 293);
        
                canvas.printText(client.functions.formatDurations(totalVoice), 1018, 143);
                canvas.printText(`${totalMessage} mesaj`, 1018, 195);
                canvas.printText(client.functions.formatDurations(totalStream), 1018, 243);
                canvas.printText(client.functions.formatDurations(totalCamera), 1018, 293);
    
                const attachment = new AttachmentBuilder(canvas.png(), { name: 'weekly-stats.png' });
        
                return interaction.reply({
                    ephemeral: true,
                    files: [attachment]
                });
            }
        });
    },
};
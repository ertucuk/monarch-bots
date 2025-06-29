const { PermissionsBitField: { Flags }, inlineCode, bold, userMention, time, codeBlock } = require('discord.js');
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
    'Public': 'Public Ceza'
};

module.exports = {
    Name: 'ceza',
    Aliases: ['cezabilgi', 'ceza-bilgi', 'document-info', 'documentinfo'],
    Description: 'Belirtilen ceza numarasının bütün bilgilerini gösterir.',
    Usage: 'ceza <ceza no>',
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

        if (isNaN(args[0])) {
            client.embed(message, 'Geçerli bir ceza numarası belirtmelisiniz.')
            return;
        }

        const document = await PunitiveModel.findOne({ id: args[0] });
        if (!document) {
            client.embed(message, 'Belirttiğiniz ceza numarasına ait bir ceza bulunamadı.')
            return;
        }

        const member = await client.getMember(document.user)
        const staff = await client.getMember(document.staff)
        const removerStaff = await client.getMember(document.remover)
        const image = client.functions.getImage(document?.reason || '');

        const fields = [];
        fields.push({
            name: `Ceza Detayı (${titles[document.type]})`,
            value: [
                `${bold(inlineCode(' > '))} Üye Bilgisi: ${userMention(member.id)} (${inlineCode(document.user)})`,
                `${bold(inlineCode(' > '))} Yetkili Bilgisi: ${userMention(staff.id)} (${inlineCode(document.staff)})`,
                `${bold(inlineCode(' > '))} Ceza Tarihi: ${time(Math.floor(document.createdTime.valueOf() / 1000), 'D')}`,
                `${bold(inlineCode(' > '))} Ceza Süresi: ${document.finishedTime ? moment.duration(document.finishedTime - document.createdTime).humanize() : 'Süresiz.'}`,
                `${bold(inlineCode(' > '))} Ceza Durumu: ${inlineCode(document.active ? 'Aktif ✔' : 'Aktif Değil ❌')}`,
            ].join('\n'),
            inline: false,
        });

        if (document.remover && document.removedTime) {
            fields.push({
                name: 'Ceza Kaldırılma Detayı',
                value: [
                    `${bold(inlineCode(' > '))} Kaldıran Yetkili: ${userMention(removerStaff.id)} (${inlineCode(document.remover)})`,
                    `${bold(inlineCode(' > '))} Kaldırma Tarihi: ${time(Math.floor(document.removedTime.valueOf() / 1000), 'D')}`,
                    `${bold(inlineCode(' > '))} Kaldırılma Sebebi: ${inlineCode(document.removeReason || 'Sebep belirtilmemiş.')}`,
                ].join('\n'),
                inline: false,
            });
        };

        const replacedReason = image ? 'Sebep belirtilmemiş.' : document.reason;

        if (replacedReason.length) {
            fields.push({
                name: 'Ceza Sebebi',
                value: codeBlock('fix', replacedReason),
                inline: false,
            });
        };

        message.reply({
            embeds: [
                embed
                    .setFields(fields)
                    .setDescription(`${bold(`#${document.id}`)} numaralı ceza bilgileri aşağıda listelenmektedir;`)
                    .setImage(image ? image : document.image ? 'attachment://ertu-gotten.png' : null),
            ],
        });

    },
};
const { EmbedBuilder, AuditLogEvent, bold, inlineCode } = require('discord.js');

module.exports = async function Timeout(client, oldMember, newMember, ertu) {
    if (
        oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp &&
        newMember.communicationDisabledUntilTimestamp
    ) {
        const entry = await newMember.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberUpdate,
        }).then((audit) => audit.entries.first());

        if (!entry || !entry.executor || entry.targetId !== newMember.id || Date.now() - entry.createdTimestamp > 5000) return;

        const executor = entry?.executor;
        const reason = entry?.reason || 'Belirtilmedi';

        const logChannel = client.channels.cache.find(c => c.name === client.data.logs.timeout)
        if (!logChannel) return;

        logChannel.send({
            embeds: [
                new EmbedBuilder({
                    thumbnail: { url: newMember.guild.iconURL({ dynamic: true }) },
                    title: 'Bir Üyeye Timeout Atıldı!',
                    description: [
                        `${newMember} üyesine ${executor} tarafından ${bold(reason)} sebebiyle timeout atıldı.`,
                        ``,
                        `→ Kullanıcı: ${newMember} (${inlineCode(newMember.id)})`,
                        `→ Yetkili: ${executor} (${inlineCode(executor.id)})`,
                        `→ Sebep: ${bold(reason)}`,
                        `→ Tarih: ${client.timestamp(Date.now())} ${client.timestamp(Date.now(), 'f')}`,
                        `→ Kaldırma Tarihi: ${newMember.communicationDisabledUntilTimestamp ? `${client.timestamp(newMember.communicationDisabledUntilTimestamp)} ${client.timestamp(newMember.communicationDisabledUntilTimestamp, 'f')}` : 'Bilinmiyor'}`,
                        `→ Süre: ${newMember.communicationDisabledUntilTimestamp ? (Math.floor((newMember.communicationDisabledUntilTimestamp - Date.now()) / 1000 / 60 / 60 / 24) > 0 ? Math.floor((newMember.communicationDisabledUntilTimestamp - Date.now()) / 1000 / 60 / 60 / 24) + ' gün' : Math.floor((newMember.communicationDisabledUntilTimestamp - Date.now()) / 1000 / 60 / 60) > 0 ? Math.floor((newMember.communicationDisabledUntilTimestamp - Date.now()) / 1000 / 60 / 60) + ' saat' : Math.round((newMember.communicationDisabledUntilTimestamp - Date.now()) / 1000 / 60) > 0 ? Math.round((newMember.communicationDisabledUntilTimestamp - Date.now()) / 1000 / 60) + ' dakika' : '') : 'Bilinmiyor'}`,
                    ].join('\n'),
                })
            ]
        });
    }

}
const { AuditLogEvent, EmbedBuilder, inlineCode } = require('discord.js');
const { UserModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Role(client, oldMember, newMember, ertu) {
    if (oldMember.roles.cache.map((r) => r.id) === newMember.roles.cache.map((r) => r.id)) return;

    const entry = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate }).then((audit) => audit.entries.first());
    if (!entry || !entry.executor  || entry.executor.bot || entry.targetId !== newMember.id || Date.now() - entry.createdTimestamp > 5000) return;

    const role = oldMember.roles.cache.difference(newMember.roles.cache).first();
    if (!role) return;

    const isRemove = oldMember.roles.cache.size > newMember.roles.cache.size;
    const now = Date.now();

    await UserModel.updateOne(
        { id: newMember.id },
        {
            $push: {
                roleLogs: {
                    type: isRemove ? 'remove' : 'add',
                    roles: [role?.id],
                    staff: entry.executor.id,
                    date: now
                }
            }
        },
        { upsert: true }
    );

    const logChannel = await client.getChannel(isRemove ? client.data.logs.roleRemove : client.data.logs.roleAdd, newMember);
    if (!logChannel) return;

    logChannel.send({
        flags: [4096],
        embeds: [
            new EmbedBuilder({
                color: client.getColor(isRemove ? 'red' : 'green'),
                title: `Bir Rol ${isRemove ? 'Çıkarıldı' : 'Eklendi'}! (Sağ Tık)`,
                thumbnail: { url: newMember.displayAvatarURL({ size: 2048, extension: 'png' }) },
                description: [
                    `→ Kullanıcı: ${newMember} (${inlineCode(newMember.id)})`,
                    `→ Yetkili: ${entry.executor} (${inlineCode(entry.executor.id)})`,
                    `→ Rol: ${role}`,
                    `→ Tarih: ${client.timestamp(now)}`
                ].join('\n'),
            })
        ]
    });
}
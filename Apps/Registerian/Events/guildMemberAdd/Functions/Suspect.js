const { inlineCode } = require('discord.js');

module.exports = async function Suspect(client, member, ertu, channel) {
    if (Date.now() - member.user.createdTimestamp > 1000 * 60 * 60 * 24 * 7) return false;

    await member.setRoles(ertu.settings.suspectedRole);

    channel.send({
        content: `${member} (${inlineCode(`${member.user.username} - ${member.user.id}`)}) adlı kullanıcının hesabı 7 günden az bir sürede açıldığı için şüpheliye atıldı.`
    });

    const logChannel = await client.getChannel(client.data.logs.suspect, member);
    if (!logChannel) return;

    logChannel.send({
        embeds: [
            new EmbedBuilder({
                color: client.getColor('red'),
                author: { name: member.displayName, icon_url: member.user.displayAvatarURL({ dynamic: true }) },
                title: 'Yeni Hesap Tespit Edildi',
                description: [
                    `→ Kullanıcı: ${member} (${inlineCode(member.id)})`,
                    `→ Hesap Açma Tarihi: ${client.functions.date(member.user.createdTimestamp)}`,
                    `→ Tarih: ${client.functions.date(Date.now())}`,
                ].join('\n'),
            })
        ]
    })

    return true;
}
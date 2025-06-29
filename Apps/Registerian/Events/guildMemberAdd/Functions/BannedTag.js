const { bold, inlineCode, EmbedBuilder, codeBlock } = require('discord.js');

module.exports = async function BannedTag(client, member, ertu, channel) {
    const tags = ertu.settings.bannedTags || [];
    if (!tags.length) return false;

    const tag = tags.find((t) => member.user.displayName.toLowerCase().includes(t.toLowerCase()));
    if (!tag) return false;

    await member.setRoles(ertu.settings.bannedTagRole).catch(() => null);

    channel.send({
        content: `${member} (${inlineCode(`${member.user.username} - ${member.user.id}`)}) adlı üye ${bold('yasaklı taglı')} olduğu için cezalı olarak belirlendi.`
    });

    member.send({
        content: 'Merhaba, sunucumuzda yasaklı taglı olduğunuz için cezalı olarak belirlendiniz. Kayıt olmak için lütfen yasaklı tagı kaldırın.'
    })

    const bannedTagLog = await client.getChannel(client.data.logs.bannedtag, member);
    if (bannedTagLog) bannedTagLog.send({
        flags: [4096],
        embeds: [new EmbedBuilder({
            color: client.getColor('red'),
            title: 'Yasaklı Taglı Üye Tespit Edildi',
            description: `${member} adlı üye yasaklı taglı (${inlineCode(tag || 'ertucumHarikasın')}) olduğu için banlandı`,
            fields: [
                {
                    name: '\u200b',
                    value: codeBlock('yaml', [
                        `# Bilgilendirme`,
                        `→ Kullanıcı: ${member.user.username} (${member.user.id})`,
                        `→ Yasaklı Tag: ${tag}`,
                        `→ Tarih: ${client.functions.date(Date.now())}`,
                    ].join('\n')),
                }
            ]
        })],
    })

    return true;
}
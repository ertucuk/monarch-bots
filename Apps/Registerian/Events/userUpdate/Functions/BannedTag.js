const { EmbedBuilder, inlineCode, codeBlock, bold } = require('discord.js');
const { UserModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function BannedTag(client, oldUser, newUser, member, ertu) {
    const oldHasTag = ertu.settings.bannedTags.some((tag) => oldUser.displayName.toLowerCase().includes(tag.toLowerCase()));
    const newHasTag = ertu.settings.bannedTags.some((tag) => newUser.displayName.toLowerCase().includes(tag.toLowerCase()));

    const logChannel = await client.getChannel(client.data.logs.bannedtag, member);
    const tag = ertu.settings.bannedTags.find((tag) => newUser.displayName.toLowerCase().includes(tag.toLowerCase()));

    if (!oldHasTag && newHasTag) {
        member.setRoles(ertu.settings.bannedTagRole);
        const isTag = member.displayName.includes(ertu.settings.tag) ? ertu.settings.tag : ertu.settings.secondTag;
        member.setNickname(member.displayName.replace(isTag, '[YASAKLI-TAG]').replace(ertu.settings.secondTag, '[YASAKLI-TAG]')).catch(() => null);

        if (logChannel) logChannel.send({
            flags: [4096],
            embeds: [new EmbedBuilder({
                color: client.getColor('red'),
                title: 'Yasaklı Taglı Üye Tespit Edildi',
                description: [
                    `${member} adlı üye yasaklı taglı (${inlineCode(tag || 'ertu')}) olduğu için yasaklı taglı olarak işaretlendi.`,
                    '',
                    `→ Kullanıcı: ${member} (${inlineCode(member.user.id)})`,
                    `→ Yasaklı Tag: ${inlineCode(tag || 'ertu')}`,
                    `→ Tarih: ${client.timestamp(Date.now())}`,
                ].join('\n')
            })],
        });

        return true;
    };

    if (oldHasTag && !newHasTag) {

        const document = await UserModel.findOne({ id: member.id });
        if (document && document.name && document.nameLogs) {
            member.setNickname(`${member.tag()} ${document.name}`);
            member.setRoles(document?.gender === 'Man' ? ertu.settings.manRoles : ertu.settings.womanRoles);
        } else {
            member.setNickname(`${member.tag()} ${ertu.settings.name}`);
            member.setRoles(ertu.settings.unregisterRoles);
        }

        if (logChannel) logChannel.send({
            flags: [4096],
            embeds: [new EmbedBuilder({
                color: client.getColor('green'),
                title: 'Yasaklı Tagı Olmayan Üye Tespit Edildi',
                description: [
                    `${member} adlı üye yasaklı taglı olduğu için banı kaldırıldı.`,
                    '',
                    `→ Kullanıcı: ${member} (${inlineCode(member.user.id)})`,
                    `→ Yasaklı Tag: ${inlineCode(tag || 'ertu')}`,
                    `→ Tarih: ${client.timestamp(Date.now())}`,
                ].join('\n')
            })],
        });

        return true;
    };

    return false;
}
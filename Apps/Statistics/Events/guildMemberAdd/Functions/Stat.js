const { bold, inlineCode } = require('discord.js');
const { UserModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Stat(client, member, ertu, invites) {
    const notHasInvite = client.invites.find((i) => !invites?.has(i.code));
    const invite = invites.find((i) => client.invites.has(i.code) && i.uses && i.uses > (client.invites.get(i.code)?.uses ?? 0)) || notHasInvite;

    const logChannel = member.guild.channels.cache.get(ertu.settings?.inviteChannel);

    const isSuspect = 1000 * 60 * 60 * 24 * 7 >= Date.now() - member.user.createdTimestamp;
    if (!invite || !invite.inviter) {
        if (logChannel) logChannel.send({
            flags: [4096],
            content: `${await client.getEmoji('check')} ${member} (${inlineCode(`${member.user.username} - ${member.user.id}`)}) üyesi sunucumuza ${bold('ÖZEL URL')} tarafından davet edildi.`
        });
        return;
    };

    if (notHasInvite) client.invites.delete(invite.code);
    else client.invites.set(invite.code, { code: invite.code, inviter: invite.inviter, uses: invite.uses || 0 });

    await UserModel.updateOne({ id: member.user.id }, { $set: { inviter: invite.inviter.id } }, { upsert: true });

    const document = await UserModel.findOneAndUpdate(
        { id: invite.inviter.id },
        {
            $inc: { [`invitesData.${isSuspect ? 'suspect' : 'normal'}`]: 1 },
            $push: { invites: { user: member.user.id, date: Date.now() } }
        },
        { upsert: true, new: true }
    );

    if (logChannel) logChannel.send({
        flags: [4096],
        content: `${await client.getEmoji('check')} ${member} (${inlineCode(`${member.user.username} - ${member.user.id}`)}) üyesi sunucumuza ${invite.inviter} tarafından davet edildi, ve bu kişinin toplam davet sayısı (${bold(document.invitesData.normal?.toString() || '0')}) oldu.`
    });
}
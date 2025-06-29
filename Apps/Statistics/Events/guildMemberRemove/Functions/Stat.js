const { bold, inlineCode } = require('discord.js');
const { UserModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Stat(client, member, ertu) {
  const memberData = await UserModel.findOne({ id: member.id });
  const logChannel = member.guild.channels.cache.get(ertu.settings?.inviteChannel);

  if (!memberData || !memberData.inviter) {
    return logChannel?.send({
      flags: [4096],
      content: `${await client.getEmoji('mark')} ${member}(${inlineCode(`${member.user.username} - ${member.user.id}`)}) üyesi sunucumuzdan ayrıldı. ${bold('ÖZEL URL')} tarafından davet edilmişti.`
    });
  };

  const inviterData = await UserModel.findOne({ id: memberData.inviter });
  if (!inviterData) return logChannel?.send({
    flags: [4096],
    content: `${await client.getEmoji('mark')} (${inlineCode(`${member.user.username} - ${member.user.id}`)}) üyesi sunucumuzdan ayrıldı. Davet eden kişi veritabanımızda bulunamadı.`
  });

  const inviter = member.guild.members.cache.get(memberData.inviter);
  if (inviter) {
    inviterData.invitesData.normal -= 1;
    inviterData.invitesData.leave = (inviterData.invitesData.leave || 0) + 1;
    inviterData.invites = inviterData.invites.filter((i) => i.user !== member.id);
  };

  memberData.inviter = undefined;
  memberData.markModified('inviter');
  memberData.save();

  inviterData.markModified('invitesData');
  inviterData.save();

  if (logChannel) logChannel.send({
    flags: [4096],
    content: `${await client.getEmoji('mark')} ${member} (${inlineCode(`${member.user.username} - ${member.user.id}`)}) üyesi sunucumuzdan ayrıldı. ${inlineCode(inviter?.user.username || 'Bilinmeyen')} tarafından davet edilmişti bu kişinin toplam (${bold(`${inviterData.invitesData.normal}`)}) daveti oldu.`,
  });
}
const { StaffModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Staff(client, member, ertu) {
  const document = await StaffModel.findOne({ user: member.id });
  if (!document || !document.inviter) return;

  const inviter = member.guild.members.cache.get(document.inviter);
  if (!inviter || !client.staff.check(inviter, ertu)) return;

  const staffDocument = await StaffModel.findOne({ user: inviter.id });
  if (!staffDocument || staffDocument.inviteds.some((x) => x.user === member.id)) return;

  await StaffModel.updateOne(
    { user: inviter.id },
    {
      $set: {
        inviteds: staffDocument.inviteds.filter((i) => i.user !== member.id),
      },
      $inc: {
        totalPoints: -40,
        invitePoints: -40,
      },
    }
  );

}
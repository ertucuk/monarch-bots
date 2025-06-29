module.exports = async function Staff(client, member, ertu, invites) {
    const notHasInvite = client.staffInvites.find((i) => !invites.has(i.code));
    const invite = invites.find((i) => client.staffInvites.has(i.code) && i.uses && i.uses > (client.staffInvites.get(i.code)?.uses ?? 0)) || notHasInvite;

    if (!invite || !invite.inviter || 1000 * 60 * 60 * 24 * 7 >= Date.now() - member.user.createdTimestamp) return;
    if (notHasInvite) client.staffInvites.delete(invite.code);
    else client.staffInvites.set(invite.code, { code: invite.code, inviter: invite.inviter, uses: invite.uses || 0 });

    const inviteMember = member.guild.members.cache.get(invite.inviter.id);
    if (!inviteMember || !client.staff.check(inviteMember, ertu)) return;

    client.staff.checkRank(client, inviteMember, ertu, { type: 'invitePoints', amount: 1, point: 40, user: member.id });
}
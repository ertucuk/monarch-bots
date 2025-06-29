const { PermissionFlagsBits } = require('discord.js')

module.exports = async function tagControl(client, log, guild, ertu) {
    if (log.executor.bot) return;

    const staffMember = await guild.members.fetch(log.executor.id);
    if (staffMember.permissions.has(PermissionFlagsBits.Administrator) || ertu.founders.some(r => staffMember.roles.cache.has(r))) return;

    const member = await guild.members.fetch(log.target.id);
    if (!member) return;

    log.changes.forEach(change => {
        if (change.key === 'nick') {
            if (change.old.includes(guild.find.settings.tag) && !change.new.includes(guild.find.settings.tag)) member.setNickname(change.old).catch(() => { });
            if (change.old.includes(guild.find.settings.secondTag) && !change.new.includes(guild.find.settings.secondTag)) member.setNickname(change.old).catch(() => { });
        }
    });
}
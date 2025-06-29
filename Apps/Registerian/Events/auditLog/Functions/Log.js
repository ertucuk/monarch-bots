const { EmbedBuilder } = require('discord.js')

module.exports = async function logHandler(client, log, guild) {
    if (log.executor.bot) return;

    const staffMember = await guild.members.fetch(log.executor.id);
    if (!staffMember) return;
    
    const member = await guild.members.fetch(log.target.id);
    if (!member) return;

    const logChannel = await client.getChannel(client.data.logs.name, member)
    if (!logChannel) return;

    if (log.changes) {
        const nickChange = log.changes.find(change => change.key === 'nick');
        if (nickChange) {
            logChannel.send({
                embeds: [
                    new EmbedBuilder({
                        color: client.getColor('random'),
                        author: { name: member.displayName, icon_url: member.user.displayAvatarURL({ dynamic: true }) },
                        description: [
                            `${member} üyesinin ismi ${staffMember} tarafından değiştirildi.\n`,
                            `${await client.getEmoji('point')} İsim: \` ${nickChange.old || 'Belirtilmemiş'} -> ${nickChange.new || 'Belirtilmemiş'} \``,
                            `${await client.getEmoji('point')} Kullanıcı: \`${member.displayName} (${member.id})\``,
                            `${await client.getEmoji('point')} Eylem Gerçekleşme: ${client.timestamp(Date.now())}\n`,
                            `⚠️ **Eylemi Gerçekleştiren Kişi:** ${staffMember} \`(${staffMember.id})\``,
                        ].join('\n'),
                    })
                ]
            })
        }
    }
}
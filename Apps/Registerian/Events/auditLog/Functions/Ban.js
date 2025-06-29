const { EmbedBuilder } = require('discord.js')

module.exports = async function banHandler(client, log, guild, ertu) {
    const logChannel = await client.getChannel('sağ-tık-yasaklama', ertu.id);
    if (!logChannel) return

    const target = log?.target || 'Bilinmiyor';
    const executor = log?.executor || 'Bilinmiyor';

    logChannel.send({
        embeds: [
            new EmbedBuilder({
                color: client.getColor('random'),
                author: { name: target.username, icon_url: target.displayAvatarURL({ dynamic: true }) },
                description: [
                    `${target} üyesi ${executor} tarafından yasaklandı.\n`,
                    `${await client.getEmoji('point')} Kullanıcı: \`${target.username} (${target.id})\``,
                    `${await client.getEmoji('point')} Yasaklayan: \`${executor.username} (${executor.id})\``,
                    `${await client.getEmoji('point')} Eylem Gerçekleşme: ${client.timestamp(Date.now())}\n`,
                    `⚠️ **Eylemi Gerçekleştiren Kişi:** ${executor} \`(${executor.id})\``,
                ].join('\n'),
            })
        ]
    });
}
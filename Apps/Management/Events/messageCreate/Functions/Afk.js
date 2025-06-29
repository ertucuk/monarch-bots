const { EmbedBuilder, bold, userMention, time } = require('discord.js')

module.exports = async function afkHandler(client, message, prefix) {
    if (prefix && message.content?.toLowerCase().includes(`${prefix}afk`) || message.author.bot) return;

    const embed = new EmbedBuilder({
        color: client.getColor('random'),
        author: {
            name: message.author.username,
            iconURL: message.author.displayAvatarURL({ extension: 'png', size: 4096 })
        }
    });

    if (message.member?.displayName.startsWith('[AFK]')) {
        message.member.setNickname(message.member.displayName.replace(/\[AFK\] ?/g, ''));
    };

    const document = client.afks.get(message.author.id)
    if (document) {
        embed.setDescription(`${message.author}, artık ${bold('AFK')} olarak gözükmüyorsun. Afk Süresi: ${bold(client.functions.formatDurations(Date.now() - document.timestamp))}`);
        if (document.mentions.length) {
            embed.addFields([
                {
                    name: 'Sen yokken seni etiketleyen kullanıcılar',
                    value: document.mentions.map((m) => `${userMention(m.user)} (${time(m.timestamp)})`).join('\n'),
                },
            ]);
        }

        message.channel.send({ embeds: [embed] }).then((msg) => setTimeout(() => msg.delete(), 5000)).catch(() => { });
        client.afks.delete(message.author.id);
        return;
    }

    if (message.mentions.users.size >= 1 && 25 >= message.mentions.users.size) {
        const now = Math.floor(Date.now() / 1000);
        const afks = client.afks.filter((_, k) => message.mentions.users.get(k))
        const fields = [];

        afks.forEach((afk, id) => {
            afk.mentions.push({ user: message.author.id, timestamp: now })

            const user = message.mentions.users.find((u) => u.id === id)
            const afkDuration = time(Math.floor(afk.timestamp / 1000), 'R')
            fields.push({
                name: `${user.username}`,
                value: `Sebep: ${afk.reason || 'Sebep belirtilmemiş.'}\n AFK Süresi: ${bold(afkDuration)}`,
                inline: true
            });

            message.reply({
                embeds:
                    [
                        embed.setDescription(`Belirttiğin ${message.mentions.users.size > 1 ? 'Kullanıcılar' : 'Kullanıcı'} AFK!`).setFields(fields)
                    ]
            }).then((msg) => setTimeout(() => msg.delete(), 10000)).catch(() => { })
        });
    }
}
const { codeBlock } = require('discord.js');

module.exports = {
    Name: 'banlist',
    Aliases: ['ban-list'],
    Description: 'Sunucudaki yasaklı kullanıcıları listeler.',
    Usage: 'banlist',
    Category: 'Admin',
    Cooldown: 0,

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {

        const bans = await message.guild?.bans.fetch();
        if (!bans || bans.size === 0) return client.embed(message, 'Sunucuda yasaklanmış üye bulunmamaktadır!')

        const formattedBans = bans.map(ban => `→ ${ban.user.username} (${ban.user.id}): ${ban.reason || 'Sebep belirtilmemiş.'}`).join('\n');
        const [firstPart, ...remainingParts] = client.functions.splitMessage(formattedBans, { maxLength: 2000, char: '\n' });
        message.channel.send({
            content: [
                codeBlock('diff', `Sunucumuzda toplam ${bans.size} yasaklı kullanıcı bulunmakta. Kişilerin ban nedenlerini öğrenmek icin .banbilgi <id> komutunu kullanabilirsin.`),
                codeBlock('js', firstPart),
            ].join('\n')
        });

        for (const content of remainingParts) {
            message.channel.send({
                content: codeBlock('js', content)
            });
        }
    },
};
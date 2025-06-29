const { Events, AuditLogEvent, EmbedBuilder, codeBlock, escapeMarkdown } = require('discord.js')

module.exports = {
    Name: Events.MessageUpdate,
    System: true,

    execute: async (client, oldMessage, newMessage) => {
        if (!newMessage.guild || newMessage.guild.id !== client.system.serverID || !newMessage.author || newMessage.author.bot || newMessage.embeds.length > 0) return;

        const channel = await client.getChannel(client.data.logs.message, newMessage);
        if (!channel) return;

        const differentAttachments = oldMessage.attachments.difference(newMessage.attachments);

        const embed = new EmbedBuilder({
            color: client.getColor('random'),
            description: [
                codeBlock('fix', [
                    `# ${differentAttachments.size > 0 && oldMessage.cleanContent !== newMessage.cleanContent
                        ? 'Mesaj Güncellendi!'
                        : differentAttachments.size > 0
                            ? 'Mesajdaki Resim Kaldırıldı!'
                            : 'Mesaj İçeriği Güncellendi!'
                    }`,
                    `→ Kanal: ${newMessage.channel.name}`,
                    `→ Mesaj ID: ${newMessage.id}`,
                    `→ Gönderen: ${newMessage.author.tag} (${newMessage.author.id})`,
                    `→ Gönderilme Tarihi: ${client.functions.date(oldMessage.createdTimestamp)}`,
                ].join('\n')),
                codeBlock('diff', [
                    `- ${escapeMarkdown(oldMessage.cleanContent || 'Mesaj içeriği yok!')}`,
                    `+ ${escapeMarkdown(newMessage.cleanContent || 'Mesaj içeriği yok!')}`,
                ].join('\n')),
                differentAttachments.size > 0 ? codeBlock('yaml', '# Silinen Resim') : undefined,
            ].filter(Boolean).join('\n'),
        });

        const msg = await channel.send({ embeds: [embed] });
        const oldAttachments = oldMessage.attachments.map(attachment => attachment.url);
        const newAttachments = newMessage.attachments.map(attachment => attachment.url);

        const oldChunks = client.functions.chunkArray(oldAttachments, 4);
        const newChunks = client.functions.chunkArray(newAttachments, 4);

        for (const chunk of oldChunks) {
            const embeds = [new EmbedBuilder().setTitle('Eski Mesaj Resimleri').setURL('https://ertu.live')];

            for (const img of chunk) {
                embeds.push(new EmbedBuilder({
                    url: 'https://ertu.live',
                    image: {
                        url: img,
                    },
                }));
            }

            await msg.reply({ embeds: embeds });
        };

        for (const chunk of newChunks) {
            const embeds = [new EmbedBuilder().setTitle('Yeni Mesaj Resimleri').setURL('https://ertu.live')];

            for (const img of chunk) {
                embeds.push(new EmbedBuilder({
                    url: 'https://ertu.live',
                    image: {
                        url: img,
                    },
                }));
            }

            await msg.reply({ embeds: embeds });
        };
    }
};
const { Events, AuditLogEvent, EmbedBuilder, codeBlock } = require('discord.js')
const { SettingsModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: Events.MessageDelete,
    System: true,

    execute: async (client, message) => {
        if (!message.guild || message.guild.id !== client.system.serverID || !message.author || message.author.bot || !message.guild || message.embeds.length > 0 || message.content == null) return;

        try {
            if (message.partial) message = await message.fetch();

            const fetchedLogs = await message.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageDelete });
            const entry = fetchedLogs.entries.first();

            const channel = await client.getChannel(client.data.logs.message, message);
            if (!channel) return;

            const embed = new EmbedBuilder({
                color: client.getColor('random'),
                author: { name: message.author.username, icon_url: message.author.displayAvatarURL({ extension: 'png', size: 4096 }) },
                description: [
                    message.cleanContent.length ? codeBlock('fix', message.cleanContent) : undefined,
                    codeBlock('yaml', [
                        '# Bilgilendirme',
                        `→ Kanal: ${message.channel.name}`,
                        `→ Mesaj ID: ${message.id}`,
                        `→ Gönderen: ${message.author.username} (${message.author.id})`,
                        `→ Yetkili: ${entry?.executor?.username || 'Bulunamadı'}`,
                        `→ Gönderilme Tarihi: ${client.functions.date(message.createdTimestamp)}`,
                    ].join('\n')),
                ].filter(Boolean).join('\n'),
            });

            const msg = await channel.send({ embeds: [embed] });
            const chunks = client.functions.chunkArray(message.attachments.map(attachment => attachment.url), 4);

            for (const chunk of chunks) {
                const embeds = [new EmbedBuilder().setTitle('Mesaj Resimleri').setURL('https://monarchcompany.com.tr')];

                for (const img of chunk) {
                    embeds.push(new EmbedBuilder({
                        url: 'https://monarchcompany.com.tr',
                        image: {
                            url: img,
                        },
                    }));
                }

                await msg.reply({ embeds: embeds });
            };

            message.guild?.updateSettings({
                $push: {
                    snipesData: {
                        id: message.id,
                        channel: message.channel.id,
                        logMessage: msg.id,
                        author: message.author,
                        staff: entry?.executor,
                        content: message.cleanContent,
                        attachments: message.attachments.map(attachment => attachment.url),
                        created: message.createdTimestamp,
                        deleted: Date.now(),
                    }
                }
            });
        } catch (error) {
            return client.logger.error(`Failed to fetch message: ${message.id} in guild: ${message.guild.id}. Error: ${error}`);
        }
    }
};
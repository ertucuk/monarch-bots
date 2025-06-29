const {
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags,
    ChannelType,
    SeparatorSpacingSize,
    PermissionFlagsBits,
    channelMention,
    roleMention
} = require('discord.js');

module.exports = {
    Name: 'server',
    Aliases: ['sunucu'],
    Description: 'Sunucu kontrol komutları.',
    Usage: 'server <log | emoji | rol>',
    Category: 'Root',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {
        if (!['log', 'emoji', 'rol'].some(x => args[0] == x))
            return message.reply({ content: `Lütfen geçerli bir işlem belirtin. \`log\`, \`emoji\`, \`rol\`` });

        if (args[0] == 'emoji') {
            let results = [];
            let total = client.data.emojis.length;
            let success = 0;
            let failed = 0;

            for (const emoji of client.data.emojis) {
                const existing = message.guild.emojis.cache.find(e => e.name === emoji.name);
                if (existing) {
                    results.push(`${existing.toString()} : Zaten var`);
                    continue;
                }

                try {
                    const created = await message.guild.emojis.create({ attachment: emoji.url, name: emoji.name });
                    results.push(`${created.toString()} : Yüklendi`);
                    success++;
                } catch {
                    results.push(`❌ ${emoji.name} : Başarısız`);
                    failed++;
                }
            }

            const container = new ContainerBuilder();

            const title = new TextDisplayBuilder().setContent('### Emoji Yükleme İşlemi');
            container.addTextDisplayComponents(title);

            container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

            const resultTitle = new TextDisplayBuilder().setContent('**Emoji Yükleme Sonuçları:**');
            container.addTextDisplayComponents(resultTitle);

            if (results.length === 0) {
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-'));
            } else {
                for (const line of results) {
                    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(line));
                }
            }

            container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));

            const result = new TextDisplayBuilder().setContent(
                `**Toplam: ${success + results.filter(x => x.includes('Zaten var')).length}/${total} emoji yüklendi, ${failed} başarısız**`
            );
            container.addTextDisplayComponents(result);

            await message.channel.send({
                components: [container],
                flags: [
                    MessageFlags.IsComponentsV2,
                ],
            })
        }

        if (args[0] == 'log') {
            const categorySettings = [
                { name: `${message.guild.name} | Loglar`, channels: client.data.logs },
            ];

            let results = [];
            let total = 0, success = 0, failed = 0;

            for (const setting of categorySettings) {
                let category = message.guild.channels.cache.find(c => c.name === setting.name && c.type === ChannelType.GuildCategory);

                if (!category) {
                    try {
                        category = await message.guild.channels.create({
                            name: setting.name,
                            type: ChannelType.GuildCategory,
                            position: 99,
                            permissionOverwrites: [{
                                id: message.guild.roles.everyone,
                                deny: [PermissionFlagsBits.ViewChannel]
                            }]
                        });
                        results.push(`**📁 ${setting.name} : Kategori oluşturuldu**`);
                    } catch {
                        results.push(`❌ ${setting.name} : Kategori oluşturulamadı`);
                        continue;
                    }
                } else {
                    results.push(`**📁 ${setting.name} : Kategori zaten var**`);
                }

                for (const name of Object.values(setting.channels)) {
                    total++;
                    let existing = message.guild.channels.cache.find(c => c.name === name && c.parentId === category.id);
                    let channel = message.guild.channels.cache.find(c => c.name === name && c.parentId === category.id);

                    if (existing) {
                        results.push(`${channelMention(channel.id)} : Zaten var`);
                        continue;
                    }
                    try {
                        await message.guild.channels.create({
                            name,
                            type: ChannelType.GuildText,
                            parent: category.id,
                            permissionOverwrites: [{
                                id: message.guild.roles.everyone,
                                deny: [PermissionFlagsBits.ViewChannel]
                            }]
                        });
                        results.push(`#${name} : Oluşturuldu`);
                        success++;
                    } catch {
                        results.push(`❌ #${name} : Oluşturulamadı`);
                        failed++;
                    }
                }
            }

            const container = new ContainerBuilder();
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent('### Log Kanalı Kurulumu'));
            container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent('**Kanal Kurulum Sonuçları:**'));

            for (const line of results) {
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(line));
            }

            container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Toplam: ${success + results.filter(x => x.includes('Zaten var')).length}/${total} kanal oluşturuldu, ${failed} başarısız**`
                )
            );

            await message.channel.send({
                components: [container],
                flags: [
                    MessageFlags.IsComponentsV2,
                ],
            })
        }

        if (args[0] == 'rol') {
            let results = [];
            let total = client.data.roles.length;
            let success = 0;
            let failed = 0;

            for (const role of client.data.roles) {
                const existing = message.guild.roles.cache.find(r => r.name === role.name);

                if (role.name === '▬▬▬▬▬▬▬▬▬▬▬') {
                    try {
                        const created = await message.guild.roles.create({ name: role.name, color: role.color });
                        results.push(`${created.toString()} : Yüklendi`);
                        success++;
                    } catch {
                        results.push(`❌ ${role.name} : Başarısız`);
                        failed++;
                    }
                    continue;
                }

                if (existing) {
                    results.push(`${roleMention(existing.id)} : Zaten var`);
                    continue;
                }
                try {
                    const created = await message.guild.roles.create({ name: role.name, color: role.color });
                    results.push(`${created.toString()} : Yüklendi`);
                    success++;
                } catch {
                    results.push(`❌ ${role.name} : Başarısız`);
                    failed++;
                }
            }

            const container = new ContainerBuilder();
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent('### Rol Yükleme İşlemi'));
            container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent('**Rol Yükleme Sonuçları:**'));

            for (const line of results) {
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(line));
            }

            container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large));
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Toplam: ${success + results.filter(x => x.includes('Zaten var')).length}/${total} rol yüklendi, ${failed} başarısız**`));

            await message.channel.send({
                components: [container],
                flags: [
                    MessageFlags.IsComponentsV2,
                ],
            })
        }
    },
};
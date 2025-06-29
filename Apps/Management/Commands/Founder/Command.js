const { PermissionsBitField: { Flags }, ActionRowBuilder, RoleSelectMenuBuilder, EmbedBuilder, inlineCode, MentionableSelectMenuBuilder } = require('discord.js');

module.exports = {
    Name: 'özelkomut',
    Aliases: [],
    Description: 'Özel komut oluşturur.',
    Usage: 'özelkomut',
    Category: 'Root',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {
        if (!['ekle', 'çıkar', 'liste'].some(x => args[0] == x)) return message.reply({ content: `Lütfen geçerli bir işlem belirtin. \`ekle\`, \`çıkar\`, \`liste\`` })

        if (args[0] == 'ekle') {
            const data = ertu ? ertu.specialCmds : [];
            const msg = await message.channel.send({
                content: `Eklemek istediğin komutun adını yazman yeterlidir. (İşlem 15 saniye sonra iptal edilecektir.)`
            })

            const filter = i => i.author.id == message.member.id
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });

            const commandName = collected.first()?.content.trim();

            if (data.find(cmd => cmd.permName === commandName)) {
                return message.reply({ content: `Bu komut zaten eklenmiş.` });
            }

            if (client.commands.find(cmd => cmd.Name === commandName)) {
                return message.reply({ content: `Bot üzerinde böyle bir komut bulunmakta.` })
            }

            if (commandName === 'iptal' || commandName === 'i') {
                return initialMessage.delete();
            }

            if (commandName.includes(' ')) {
                return message.channel.send({ content: `Komut ismi boşluk içeremez.` });
            }

            if (commandName.length > 20) {
                return message.channel.send({ content: `Komut ismi 20 karakterden uzun olamaz.` });
            }

            const push = { permName: commandName };
            await collected.first()?.delete();
            const authMentionableMessage = await msg.edit({
                content: 'Komutu kullanma izni verilecek kullanıcıları ve rolleri aşağıdaki menüden seçiniz.',
                components: [
                    new ActionRowBuilder().addComponents(
                        new MentionableSelectMenuBuilder()
                            .setCustomId('permMentionableSelectMenu')
                            .setPlaceholder('Kişi veya rol seçin')
                            .setMaxValues(15)
                    )
                ]
            });

            const collector = msg.createMessageComponentCollector({
                filter: i => i.user.id === message.author.id, time: 45000
            });

            collector.on('collect', async i => {
                if (i.customId === 'permMentionableSelectMenu') {
                    push.permRoles = i.values;
                    await i.deferUpdate();

                    const roleMessage = await message.channel.send({
                        content: `Verilecek rolü seçin.`,
                        components: [new ActionRowBuilder().addComponents(
                            new RoleSelectMenuBuilder()
                                .setCustomId('permRolesSelectMenu')
                                .setMaxValues(5)
                        )]
                    });

                    const roleCollector = roleMessage.createMessageComponentCollector({
                        filter: i => i.user.id === message.author.id, time: 35000
                    });

                    roleCollector.on('collect', async i => {
                        if (i.customId === 'permRolesSelectMenu') {
                            push.permRoles2 = i.values;

                            await SettingsModel.updateOne(
                                { id: message.guild?.id },
                                { $push: { specialCmds: push } },
                                { upsert: true }
                            );

                            await i.deferUpdate();
                            await roleMessage.delete();
                            await authMentionableMessage.delete();

                            message.react(await client.getEmoji('check'));
                            return message.channel.send({
                                embeds: [
                                    new EmbedBuilder({
                                        color: client.getColor('random'),
                                        description: [
                                            `Özel komut başarıyla eklendi.`,
                                            `**Komut Adı:** ${push.permName}`,
                                            `**Y. Rolleri:** ${push.permRoles.map(x => message.guild?.members.cache.get(x)?.toString() || `<@&${x}>`).join(', ')}`,
                                            `**Roller:** ${push.permRoles2.map(x => `<@&${x}>`).join(', ')}`
                                        ].join('\n')
                                    })
                                ]
                            });
                        }
                    });
                }
            });

        } else if (args[0] == 'çıkar') {
            const data = ertu ? ertu.specialCmds : [];
            const msg = await message.channel.send({
                content: `Çıkarmak istediğin komutun adını yazman yeterlidir. (İşlem 15 saniye sonra iptal edilecektir.)`
            })

            const filter = i => i.author.id == message.member.id
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });

            const commandName = collected.first()?.content.trim();

            if (!data.find(cmd => cmd.permName === commandName)) {
                return message.reply({ content: `Bu komut bulunamadı.` });
            }

            if (commandName === 'iptal' || commandName === 'i') {
                return initialMessage.delete();
            }

            await message.guild?.updateSettings({
                $pull: {
                    specialCmds: {
                        permName: commandName
                    }
                }
            });

            return msg.edit({
                embeds: [
                    new EmbedBuilder({
                        color: client.getColor('random'),
                        description: `Özel komut başarıyla çıkarıldı.`
                    })
                ]
            });

        } else if (args[0] == 'liste') {
            const data = ertu ? ertu.specialCmds : [];
            if (!data.length) return message.reply({ content: `Hiç özel komut eklenmemiş.` });

            const mappedData = data.map((cmd) =>
                `${inlineCode(cmd.permName)} - ` +
                `${cmd.permRoles2?.map(x => `<@&${x}>`).join(', ') || 'Yok'} ` +
                `(${cmd.permRoles?.map(x => message.guild?.members.cache.get(x)?.toString() || `<@&${x}>`).join(', ') || 'Yok'})`
            );


            let page = 1;
            const totalData = Math.ceil(data.length / 15);

            const embed = new EmbedBuilder({
                description: `Toplamda ${data.length} özel komut bulunmakta.\n\n${mappedData.slice(0, 15).join('\n')}`
            });

            const msg = await message.channel.send({
                embeds: [embed],
                components: totalData > 1 ? [client.getButton(page, totalData)] : []
            });

            const collector = msg.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== message.author.id) return;

                await i.deferUpdate();
                if (i.customId === 'first') page = 1;
                if (i.customId === 'previous') page -= 1;
                if (i.customId === 'next') page += 1;
                if (i.customId === 'last') page = totalData;

                embed.setDescription(`Toplamda ${data.length} özel komut bulunmakta.\n\n${mappedData.slice(page === 1 ? 0 : page * 15 - 15, page * 15).join('\n')}`);
                await msg.edit({ embeds: [embed], components: [client.getButton(page, totalData)] });
            });

            collector.on('end', () => msg.edit({ components: [client.functions.timesUp()] }));
        }
    },
};
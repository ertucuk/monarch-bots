const { PermissionsBitField: { Flags }, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, bold, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, inlineCode } = require('discord.js');

module.exports = {
    Name: 'yardım',
    Aliases: ['help', 'yardim', 'komutlar', 'commands'],
    Description: 'Botun komutlarını gösterir.',
    Usage: 'help',
    Category: 'Global',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {
        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('help')
                .setPlaceholder(`${client.commands.size} Komut`)
                .addOptions([
                    { label: 'Kullanıcı Komutları', value: 'Global', emoji: '1268523882562719764' },
                    { label: 'Kayıt Komutları', value: 'Register', emoji: '1268523882562719764' },
                    { label: 'Moderasyon Komutları', value: 'Moderation', emoji: '1268523882562719764' },
                    { label: 'İstatistik Komutları', value: 'Statistics', emoji: '1268523882562719764' },
                    { label: 'Yetkili Komutları', value: 'Staff', emoji: '1268523882562719764' },
                    { label: 'Üst Yetkili Komutları', value: 'Admin', emoji: '1268523882562719764' },
                    { label: 'Kurucu Komutları', value: 'Founder', emoji: '1268523882562719764' }
                ])
        );

        const embed = new EmbedBuilder({
            color: client.getColor('random'),
            thumbnail: { url: message.guild.iconURL({ dynamic: true }) },
            author: { name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) },
            description: [
                `Merhaba ${message.author}, benim komutlarımı görmek için aşağıdaki menüden bir kategori seçebilirsin.`,
                '',
                `${await client.getEmoji('arrow')} Bilgilendirme;`,
                `${await client.getEmoji('point')} Prefix: ${inlineCode('.')}`,
                `${await client.getEmoji('point')} Toplam Komut: ${inlineCode(client.commands.size)}`,
                `${await client.getEmoji('point')} Toplam Kategori: ${inlineCode(client.commands.map(x => x.Category).filter((v, i, a) => a.indexOf(v) === i).length)}`,
            ].join('\n'),
        })

        const question = await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        const collector = question.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 60000
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'help') {
                const value = interaction.values[0];
                const filteredCommands = client.commands.filter((x) => x.Category == value);

                if (filteredCommands.size === 0) {
                    return interaction.reply({
                        content: 'Bu kategoride komut bulunamadı!',
                        ephemeral: true
                    });
                }

                let page = 1;
                const totalPages = Math.ceil(filteredCommands.size / 10);

                const updateEmbed = async (currentPage) => {
                    const commandsToShow = Array.from(filteredCommands.values())
                        .slice((currentPage - 1) * 10, currentPage * 10);

                    const commandPromises = commandsToShow
                        .map(async (x) => `${await client.getEmoji('point')} ${bold(x.Name)}\n${await client.getEmoji('arrow')} Açıklama: ${inlineCode(x.Description)}\n${await client.getEmoji('arrow')} Kullanım: ${inlineCode(x.Usage)}\n${await client.getEmoji('arrow')} Alternatifler: ${x.Aliases.length > 0 ? x.Aliases.map((a) => inlineCode(a)).join(', ') : 'Yok'}\n`);

                    const commands = (await Promise.all(commandPromises)).join('\n');

                    return new EmbedBuilder({
                        color: client.getColor('random'),
                        thumbnail: { url: message.guild.iconURL({ dynamic: true }) },
                        author: { name: `${value} Komutları`, iconURL: message.guild.iconURL({ dynamic: true }) },
                        description: commands,
                        footer: { text: `Sayfa: ${currentPage}/${totalPages}` }
                    });
                };

                const categoryEmbed = await updateEmbed(page);

                const msg = await interaction.update({
                    embeds: [categoryEmbed],
                    components: totalPages > 1 ? [client.getButton(page, totalPages)] : []
                });                

                const filter = (i) => i.user.id === message.author.id;
                const buttonCollector = msg.createMessageComponentCollector({ filter, time: 60000 });

                buttonCollector.on('collect', async (i) => {
                    await i.deferUpdate();

                    if (i.customId === 'first') page = 1;
                    if (i.customId === 'previous') page = Math.max(1, page - 1);
                    if (i.customId === 'next') page = Math.min(totalPages, page + 1);
                    if (i.customId === 'last') page = totalPages;

                    const newEmbed = await updateEmbed(page);

                    await i.editReply({
                        embeds: [newEmbed],
                        components: [client.getButton(page, totalPages)]
                    });
                });
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                question.edit({ components: [client.functions.timesUp()] });
            }
        });
    }
};
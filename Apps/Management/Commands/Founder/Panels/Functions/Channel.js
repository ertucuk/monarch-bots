const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, StringSelectMenuBuilder, bold, channelMention, inlineCode } = require('discord.js');

module.exports = async function Merhaba(client, message, option, ertu, question, author, menu = 'main', functionType) {
    await question.edit({
        components: createRow(client, message.guild, option, ertu[option.root][option.value])
    });

    const filter = (i) => i.user.id === author;
    const collector = question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 10,
    });

    collector.on('collect', async (i) => {
        if (i.isButton() && i.customId === 'back') {
            collector.stop('FINISH');
            i.deferUpdate();
            functionType(client, message, question, menu);
            return;
        }

        if (i.isChannelSelectMenu()) {
            if (option.isMultiple) {
                ertu[option.root][option.value] = i.values;
            } else {
                ertu[option.root][option.value] = i.values[0];  
            }

            await i.guild?.updateSettings({
                [`${option.root}.${option.value}`]: ertu[option.root][option.value]
            });

            i.reply({
                content: `Başarıyla ${bold(option.name)} adlı ayar ${channelMention(i.values[0])} (${inlineCode(
                    i.values[0],
                )}) şeklinde ayarlandı.`,
                ephemeral: true,
            });

            question.edit({
                components: createRow(client, message.guild, option, ertu[option.root][option.value])
            });
        }

        if (i.isStringSelectMenu()) {
            if (option.isMultiple) {
                const newData = ertu[option.root][option.value] || [];
                ertu[option.root][option.value] = newData.filter((r) => !i.values.includes(r));
            } else {
                ertu[option.root][option.value] = undefined;
            }

            const updateQuery = option.isMultiple
                ? { [`${option.root}.${option.value}`]: ertu[option.root][option.value] }
                : { $unset: { [`moderation.${option.value}`]: 1 } };
            await i.guild?.updateSettings(updateQuery);

            i.reply({
                content: `Başarıyla ${bold(option.name)} adlı ayardan ${channelMention(i.values[0])} (${inlineCode(
                    i.values[0],    
                )}) kaldırıldı.`,
                ephemeral: true,
            });

            question.edit({
                components: createRow(client, message.guild, option, ertu[option.root][option.value])
            });
        }
    });

    collector.on('end', (_, reason) => {
        if (reason === 'time') {
            question.edit({ components: [client.functions.timesUp()] });
        }
    });
}

function createRow(client, guild, option, data) {
    const chunks = client.functions.chunkArray(
        (option.isMultiple ? data : [data]).filter((r) => guild.channels.cache.has(r)),
        25
    );
    const rows = [];
    let page = 0;

    for (const chunk of chunks) {
        page++;

        if (page === 3) break;
        rows.push(
            new ActionRowBuilder({
                components: [
                    new StringSelectMenuBuilder({
                        customId: 'channel:' + page,
                        placeholder: `${option.isParent ? 'Kategori' : 'Kanallar'} (Sayfa ` + page + `)`,
                        options: chunk.map((r) => {
                            const channel = guild.channels.cache.get(r);
                            return {
                                label: channel.name,
                                value: channel.id,
                            };
                        })
                    })
                ]
            })
        );
    }

    rows.push(
        new ActionRowBuilder({
            components: [
                new ChannelSelectMenuBuilder({
                    customId: 'channel',
                    placeholder: 'Kanallari ayarla',
                    maxValues: option.isMultiple ? 25 : 1,
                    channelTypes: option.isVoice
                        ? [ChannelType.GuildVoice]
                        : option.isParent
                            ? [ChannelType.GuildCategory]
                            : [ChannelType.GuildText]
                })
            ]
        })
    );

    rows.push(
        new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'back',
                    label: 'Geri',
                    style: ButtonStyle.Danger
                }),
            ],
        })
    );

    return rows;
}
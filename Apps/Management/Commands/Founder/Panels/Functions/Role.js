const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, bold, inlineCode, RoleSelectMenuBuilder, roleMention } = require('discord.js');

module.exports = async function Role(client, message, option, ertu, question, author, menu = 'main', functionType) {
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

        if (i.isRoleSelectMenu()) {
            if (option.isMultiple) ertu[option.root][option.value] = i.values;
            else ertu[option.root][option.value] = i.values[0];

            await i.guild?.updateSettings({
                [`${option.root}.${option.value}`]: ertu[option.root][option.value]
            });

            i.reply({
                content: `Başarıyla ${bold(option.name)} adlı ayar ${roleMention(i.values[0])} (${inlineCode(i.values[0])}) şeklinde ayarlandı.`,
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
            } else ertu[option.root][option.value] = undefined;

            const updateQuery = option.isMultiple
                ? { [`${option.root}.${option.value}`]: ertu[option.root][option.value] }
                : { $unset: { [`moderation.${option.value}`]: 1 } };
            await i.guild?.updateSettings(updateQuery);

            i.reply({
                content: `Başarıyla ${bold(option.name)} adlı ayardan ${roleMention(i.values[0])} (${inlineCode(i.values[0])}) kaldırdı.`,
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
    const chunks = client.functions.chunkArray((option.isMultiple ? data : [data]).filter((r) => guild.roles.cache.has(r)), 25);
    const rows = [];
    let page = 0;

    for (const chunk of chunks) {
        page++;

        if (page === 3) break;
        rows.push(
            new ActionRowBuilder({
                components: [
                    new StringSelectMenuBuilder({
                        customId: 'role:' + page,
                        placeholder: 'Roller (Sayfa ' + page + ')',
                        options: chunk.map((r) => {
                            const role = guild.roles.cache.get(r);
                            return {
                                label: role.name,
                                description: `${role.members.size} kişi`,
                                value: role.id,
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
                new RoleSelectMenuBuilder({
                    custom_id: 'role',
                    placeholder: 'Rolleri ayarla',
                    max_values: option.isMultiple ? 25 : 1,
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
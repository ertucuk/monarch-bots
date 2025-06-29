const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction, Message, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, bold, inlineCode } = require('discord.js');

module.exports = async function Limit(client, message, option, ertu, question, author, menu = 'main', functionType) {
    await question.edit({
        content: '',
        components: createRow(
            option.name,
            ertu[option.root][`${option.value}Limit`],
        ),
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

        if (i.isButton() && i.customId === 'change') {
            const limitValue = String(ertu[option.root]?.[`${option.value}Limit`] ?? '');
            const row = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('count')
                    .setValue(limitValue)
                    .setLabel('Sayı:')
                    .setMaxLength(60)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short)
            );

            const modal = new ModalBuilder()
                .setTitle(`${option.name} Ayarını Değiştirme`)
                .setCustomId('modal')
                .addComponents(row);

            await i.showModal(modal);

            const modalCollector = await i.awaitModalSubmit({ filter, time: 1000 * 60 * 3 });

            if (modalCollector) {
                ertu[option.root][`${option.value}Limit`] = modalCollector.fields.getTextInputValue('count');

                await i.guild?.updateSettings({
                    $set: {
                        [`${option.root}.${option.value}Limit`]: ertu[option.root][`${option.value}Limit`],
                    },
                });

                modalCollector.reply({
                    content: `Başarıyla ${bold(option.name)} adlı ayar ${inlineCode(ertu[option.root][`${option.value}Limit`])} şeklinde ayarlandı.`,
                    ephemeral: true,
                });

                question.edit({
                    components: createRow(
                        option.name,
                        ertu[option.root][`${option.value}Limit`],
                    ),
                });
            }
        }

        if (i.isButton() && i.customId === 'reset') {
            ertu[option.root][`${option.value}Limit`] = undefined;

            await i.guild?.updateSettings({
                $set: {
                    [`${option.root}.${option.value}Limit`]: ertu[option.root][`${option.value}Limit`],
                },
            });

            i.reply({ content: `Başarıyla ${bold(option.name)} adlı ayar sıfırlandı.`, ephemeral: true });

            question.edit({
                components: createRow(
                    option.name,
                    ertu[option.root][`${option.value}Limit`],
                ),
            });
        }
    });

    collector.on('end', (_, reason) => {
        if (reason === 'time') {
            question.edit({ components: [client.functions.timesUp()] });
        }
    });
}

function createRow(name, count) {
    return [
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('data2')
                .setDisabled(true)
                .setPlaceholder(`${name} Sayı: ${count || 'Ayarlanmamış!'}`)
                .addOptions([{ label: 'test', value: 'a' }])
        ),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('back').setLabel('Geri').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('change').setLabel('Değiştir').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('reset').setLabel('Sıfırla').setStyle(ButtonStyle.Success)
        ),
    ];
}
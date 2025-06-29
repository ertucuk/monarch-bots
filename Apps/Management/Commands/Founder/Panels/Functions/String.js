const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, bold, inlineCode, TextInputBuilder, TextInputStyle, ModalBuilder } = require('discord.js');

module.exports = async function String(client, message, option, ertu, question, author, menu = 'main', functionType) {
    await question.edit({
        components: createRow(option.name, ertu[option.root][option.value], option.isMultiple),
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
            const row = new ActionRowBuilder({
                components: [
                    new TextInputBuilder({
                        customId: 'value',
                        value: option.isMultiple
                            ? (ertu[option.root][option.value] || []).slice(0, 60).join(', ') || undefined
                            : (ertu[option.root][option.value].toString() || '').slice(0, 60) || undefined,
                        label: 'Yeni Ayar:',
                        maxLength: 60,
                        required: true,
                        style: TextInputStyle.Short,
                    }),
                ],
            });

            const modal = new ModalBuilder({
                title: `${option.name} Ayarını Değiştirme`,
                customId: 'modal',
                components: [row],
            });

            await i.showModal(modal);

            const modalCollector = await i.awaitModalSubmit({
                filter,
                time: 1000 * 60 * 3,
            });
            if (modalCollector) {
                const value = modalCollector.fields.getTextInputValue('value');
                if (option.isMultiple) ertu[option.root][option.value] = value.split(',').map((v) => v.trim());
                else if (option.isNumber) {
                    if (!Number(value)) {
                        modalCollector.reply({
                            content: 'Geçerli bir sayı gir!',
                            ephemeral: true,
                        });
                        return;
                    }
                    ertu[option.root][option.value] = Number(value);
                } else ertu[option.root][option.value] = value;

                await message.guild?.updateSettings({
                    $set: { [`${option.root}.${option.value}`]: ertu[option.root][option.value] },
                });

                modalCollector.reply({
                    content: `Başarıyla ${bold(option.name)} adlı ayar ${inlineCode(value)} şeklinde ayarlandı.`,
                    ephemeral: true,
                });

                question.edit({
                    components: createRow(option.name, ertu[option.root][option.value], option.isMultiple),
                });
            }
        }

        if (i.isButton() && i.customId === 'reset') {
            ertu[option.root][option.value] = undefined;

            await message.guild?.updateSettings({
                $unset: { [`${option.root}.${option.value}`]: ertu[option.root][option.value] },
            });

            i.reply({
                content: `Başarıyla ${bold(option.name)} adlı ayar sıfırlandı.`,
                ephemeral: true,
            });

            question.edit({
                components: createRow(option.name, ertu[option.root][option.value], option.isMultiple),
            });
        }
    });

    collector.on('end', (_, reason) => {
        if (reason === 'time') {
            question.edit({ components: [client.functions.timesUp()] });
        }
    });
}
function createRow(name, value, isMultiple) {
    return [
        new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    customId: 'data',
                    disabled: true,
                    placeholder: `${name}: ${isMultiple
                            ? (value || []).join(', ') || 'Ayarlanmamış!'
                            : value || 'Ayarlanmamış!'
                        }`,
                    options: [{ label: 'test', value: 'a' }],
                }),
            ],
        }),
        new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'back',
                    label: 'Geri',
                    style: ButtonStyle.Danger,
                }),
                new ButtonBuilder({
                    customId: 'change',
                    label: isMultiple ? (value || []).join(', ') ? 'Değiştir' : 'Ayarla' : value ? 'Değiştir' : 'Ayarla',
                    style: ButtonStyle.Success,
                }),
                new ButtonBuilder({
                    customId: 'reset',
                    label: 'Sıfırla',
                    style: ButtonStyle.Success,
                }),
            ],
        }),
    ];
}
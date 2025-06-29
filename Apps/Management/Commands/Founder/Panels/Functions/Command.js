const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Interaction, StringSelectMenuBuilder, MentionableSelectMenuBuilder, bold } = require('discord.js');
const { SettingsModel } = require('../../../../../../Global/Settings/Schemas')

module.exports = async function Komut(client, question, type, ertu, message, menu, functionType) {
    const commands = client.commands.filter((cmd) => cmd.Category === `${type.charAt(0).toUpperCase() + type.slice(1)}`);
    await question.edit({
        components: [
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('canexecute')
                    .setPlaceholder('Seçim yapın')
                    .addOptions(
                        commands.size > 0
                            ? commands.map((cmd) => ({
                                label: cmd.Name,
                                value: cmd.Name,
                                description: cmd.Description,
                            }))
                            : [{ label: 'Komut bulunamadı.', value: 'none', default: true }]
                    )
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('back')
                    .setLabel('Geri')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('manage')
                    .setLabel('Özel Ayarlar')
                    .setStyle(ButtonStyle.Secondary)
            )
        ]
    });

    const filter = (i) => i.user.id === message.author.id;
    const collector = question.createMessageComponentCollector({ filter, time: 5 * 60 * 1000 });

    collector.on('collect', async (i) => {
        if (i.customId === 'back') {
            collector.stop('FINISH');
            i.deferUpdate();
            functionType(client, message, question, menu);
            return;
        }

        if (i.customId === 'manage') {
            const commandPerms = ertu.cmdPerms || {};
            const categoryKey = `${type.charAt(0).toUpperCase() + type.slice(1)}`;
            commandPerms[categoryKey] = commandPerms[categoryKey] || { access: [], commands: [] };

            const Access = commandPerms[categoryKey].access;
            const row = new ActionRowBuilder().addComponents(
                new MentionableSelectMenuBuilder()
                    .setCustomId('access')
                    .setPlaceholder('Kisileri/rolleri seçin')
                    .setMaxValues(25)
                    .addDefaultRoles(
                        Access.filter((acc) => message.guild?.roles.cache.has(acc))
                            .map((acc) => acc)
                    )
                    .addDefaultUsers(
                        Access.filter((acc) => message.guild?.members.cache.has(acc))
                            .map((acc) => acc)
                    )
            );

            await i.reply({
                content: `${categoryKey} kategorisindeki bütün komutlar için tek seferde hepsine aynı ayarı yapabilirsiniz.`,
                components: [row],
                ephemeral: true,
            });

            const fetchReply = await i.fetchReply();
            const accessCollected = await fetchReply.awaitMessageComponent({
                time: 5 * 60 * 1000,
                componentType: ComponentType.MentionableSelect,
            }).catch(() => null);

            if (accessCollected) {
                const access = accessCollected.values;
                const newPermissions = [];

                for (const acc of access) {
                    if (!Access.includes(acc)) newPermissions.push(acc);
                    if (Access.includes(acc)) newPermissions.splice(Access.indexOf(acc), 1);
                }

                commandPerms[categoryKey].access = newPermissions;

                await SettingsModel.updateOne({ id: message.guild.id }, { $set: { 'cmdPerms': commandPerms } });

                accessCollected.deferUpdate();
                i.editReply({
                    content: `${bold(`Tüm ${categoryKey} komutları`)} için özel ayar oluşturuldu.`,
                    components: [],
                });
                return;
            } else i.deleteReply();
        }

        if (i.isAnySelectMenu() && i.values.length) {
            const commandName = i.values[0];
            const categoryKey = `${type.charAt(0).toUpperCase() + type.slice(1)}`;

            ertu.cmdPerms = ertu.cmdPerms || {};
            ertu.cmdPerms[categoryKey] = ertu.cmdPerms[categoryKey] || { access: [], commands: [] };
            ertu.cmdPerms[categoryKey].commands = ertu.cmdPerms[categoryKey].commands || [];

            const data = ertu.cmdPerms[categoryKey].commands.find((c) => c.command === commandName);

            const row = new ActionRowBuilder().addComponents(
                new MentionableSelectMenuBuilder()
                    .setCustomId('access')
                    .setPlaceholder(`${commandName} için kisileri/rolleri seçin`)
                    .setMaxValues(25)
                    .addDefaultRoles(
                        (data?.access || []).filter((acc) => message.guild?.roles.cache.has(acc))
                            .map((acc) => acc)
                    )
                    .addDefaultUsers(
                        (data?.access || []).filter((acc) => message.guild?.members.cache.has(acc))
                            .map((acc) => acc)
                    )
            );

            await i.reply({
                components: [row],
                ephemeral: true,
            });

            const fetchReply = await i.fetchReply();
            const accessCollected = await fetchReply.awaitMessageComponent({
                time: 5 * 60 * 1000,
                componentType: ComponentType.MentionableSelect,
            }).catch(() => null);

            if (accessCollected) {
                const cmd = client.commands.find(cmd => cmd.Name === commandName);
                const access = accessCollected.values;
                const Access = (ertu.cmdPerms[categoryKey].commands.find((c) => c.command === cmd.Name)?.access || []);
                const newPermissions = [];

                for (const acc of access) {
                    if (!Access.includes(acc)) newPermissions.push(acc);
                    if (Access.includes(acc)) newPermissions.splice(Access.indexOf(acc), 1);
                }

                ertu.cmdPerms[categoryKey].commands = ertu.cmdPerms[categoryKey].commands.filter((c) => c.command !== cmd.Name);
                ertu.cmdPerms[categoryKey].commands.push({
                    command: cmd.Name,
                    access: newPermissions,
                });

                await SettingsModel.updateOne({ id: message.guild.id }, { $set: { 'cmdPerms': ertu.cmdPerms } });

                accessCollected.deferUpdate();

                i.editReply({
                    content: `${bold(cmd.Name)} adlı komuta özel ayar oluşturuldu.`,
                    components: [],
                });
            } else i.deleteReply();
        }
    });

    collector.on('end', async () => {
        await question.edit({
            components: [client.functions.timesUp()]
        });
    });
}
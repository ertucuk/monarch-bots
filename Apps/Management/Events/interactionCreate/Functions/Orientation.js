const { ActionRowBuilder, ButtonBuilder, ButtonStyle, bold, userMention } = require("discord.js")

module.exports = async function Orientation(client, interaction, staff, ertu) {
    const member = interaction.guild?.members.cache.get(interaction.user.id)
    const target = interaction.guild?.members.cache.get(staff)

    if (!member || !target) return interaction.deferUpdate();

    const message = await interaction.channel.messages.fetch(interaction.message.id);

    message.edit({
        content: `${userMention(staff)} adlı yetkilinin oryantasyonu ile ${member} ilgilenecek.`,
        components: message.components.map(row =>
            new ActionRowBuilder().addComponents(
                row.components.map(component => {
                    if (component.type === 2) {
                        return new ButtonBuilder().setCustomId('staff:' + staff.id).setLabel(`${member.user.username} İlgileniyor`).setStyle(ButtonStyle.Success).setDisabled(true);
                    }
                    return component;
                })
            )
        )
    });

    interaction.reply({ content: `İşlem başarılı!`, ephemeral: true });

    await target.send({
        content: [
            `Selam! ${member} adlı yetkiliye ulaşıp oryantasyon alabilirsiniz.`,

            `${bold(interaction.guild.name || 'ertu Systems')}`,
        ].join('\n\n'),
    }).catch(() => { });
}
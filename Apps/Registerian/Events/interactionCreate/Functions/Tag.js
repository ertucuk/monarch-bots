const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');

module.exports = async function Staff(client, interaction, staff, ertu) {
    const message = await interaction.channel.messages.fetch(interaction.message.id);

    message.edit({
        content: `${interaction.user} adlı yetkili, tagı salan kişiyle DM üzerinden iletişime geçti!`,
        components: message.components.map(row =>
            new ActionRowBuilder().addComponents(
                row.components.map(component => {
                    if (component.type === 2) {
                        return new ButtonBuilder().setCustomId('tag').setLabel(`${interaction.user.username} İlgileniyor`).setStyle(ButtonStyle.Success).setDisabled(true);
                    }
                    return component;
                })
            )
        )
    });

    interaction.reply({ content: 'İşlem başarılı!', ephemeral: true });
}
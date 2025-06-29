const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');

module.exports = async function Staff(client, interaction, staff, ertu) {
    const member = interaction.guild?.members.cache.get(interaction.user.id)
    const target = interaction.guild?.members.cache.get(staff)

    const message = await interaction.channel.messages.fetch(interaction.message.id);

    if (Number(staff)) {
        message.edit({
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('staff:confirmed')
                        .setLabel('İlgileniyorum')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('staff:photo')
                        .setLabel('SS Yükle')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(false)
                )
            ]
        });

        interaction.reply({ content: `İşlem başarılı!`, ephemeral: true });
    }

    if (staff === 'photo') {
        const question = await interaction.reply({
            content: 'Kanıt için ekran görüntüsünü atınız. 2 dakika süreniz var, atılmazsa işlem iptal edilecek.',
            ephemeral: true
        });

        const filter = (msg) => msg.author.id === interaction.user.id && msg.attachments.size > 0;
        const collected = await interaction.channel.awaitMessages({
            filter,
            time: 1000 * 60 * 60,
            max: 1,
        });

        if (collected) {
            const attachment = collected?.first()?.attachments.first()?.url;
            const data = new AttachmentBuilder(attachment, { name: 'ertu.png' });
            if (!attachment) return question.edit({
                embeds: [embed.setDescription('Ekran görüntüsü reklam içermediği için işlem iptal edildi.')],
                components: [client.functions.timesUp()],
            });

            message.edit({
                content: `${interaction.user} tarafından ilgilenildi.`,
                files: [data],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('staff:confirmed')
                            .setLabel('İlgileniyorum')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('staff:photo')
                            .setLabel('SS Yükle')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    )
                ]
            });

            interaction.reply({ content: `İşlem başarılı!`, ephemeral: true });

            collected.first().delete().catch(() => null);
        }
    }
}
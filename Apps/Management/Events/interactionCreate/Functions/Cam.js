const ms = require('ms');

module.exports = async function Cam(client, interaction, route, ertu) {
    if (route === 'appeal') {
        if (!ertu.settings.camRole) return interaction.reply({ content: 'Cam rolü ayarlanmamış.', ephemeral: true });

        const member = interaction.guild?.members.cache.get(interaction.user.id);
        if (!member) return;

        const limit = client.functions.checkLimit(interaction, interaction.user.id, 'Cam', 1, ms('1m'));
        if (limit.hasLimit) return interaction.reply({ content: `Bu butonu ${limit.time} kullanabilirsin.`, ephemeral: true });

        if (!member.roles.cache.has(ertu.settings.camRole)) {
            await interaction.reply({ content: `${await client.getEmoji('check')} Kamera rolü başarıyla üzerine alındı!`, ephemeral: true });
            member.roles.add(ertu.settings.camRole).catch(() => { });
        } else {
            await interaction.reply({ content: `${await client.getEmoji('check')} Kamera rolü başarıyla üzerinizden alındı!`, ephemeral: true });
            member.roles.remove(ertu.settings.camRole).catch(() => { });
        }
    }
}
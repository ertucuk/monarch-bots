module.exports = async function Invasion(client, interaction, route, ertu) {
    const member = interaction.guild?.members.cache.get(interaction.user.id)
    if (!member) return;

    if (!ertu?.systems.invasion) {
        return interaction.reply({
            content: `${await client.getEmoji('mark')} Bu sistem yalnızca sunucuya fake hesap istilası olduğunda devreye girer, eğer bu saçma mesajı alıyorsan üzerine otorol verilmemiş demektir sunucudan çıkıp tekrardan girmen gerekiyor.`,
            ephemeral: true,
        });
    };

    const suspectRole = interaction.guild?.roles.cache.get(ertu.settings.suspectedRole)
    if (!suspectRole) {
        return interaction.reply({
            content: `${await client.getEmoji('mark')} Sistemde bir hata oluştu, Gerekli sistem ayarları yapılmamış olabilir.`,
            ephemeral: true,
        });
    }

    const limit = client.functions.checkLimit(interaction, interaction.user.id, 'Invasion', 1, ms('1h'));
    if (limit.hasLimit) return interaction.reply({ content: `Bu butonu ${limit.time} kullanabilirsin.`, ephemeral: true });

    if (Date.now() - member.user.createdTimestamp < 1000 * 60 * 60 * 24 * 7) {
        if (!member.roles.cache.has(ertu.settings.suspectedRole)) member.setRoles(ertu.settings.suspectedRole);

        interaction.reply({
            content: `Hesabın 7 günden daha yeni olduğu için şüpheli hesap olarak işaretlendi.`,
            ephemeral: true,
        }).catch(() => { });
    } else {
        member.setNickname(`${member.tag()} ${ertu.settings.name}`);
        await member.setRoles(ertu.settings?.unregisterRoles);

        interaction.reply({
            content: `Hesabın 7 günden daha eski olduğu için kayıtsız rolü verildi.`,
            ephemeral: true,
        });
    };
}
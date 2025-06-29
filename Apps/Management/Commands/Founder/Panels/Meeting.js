const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    Name: 'toplantıpanel',
    Aliases: ['toplantipanel', 'meetingpanel', 'toplantı-panel'],
    Description: 'Toplantı panelini açar.',
    Usage: 'toplantıpanel',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {
        if (!ertu.settings.staffResponsibilities.length) {
            return message.channel.send({ content: 'Sunucuda hiçbir sorumluluk tanımlanmamış.' });
        }

        const embed = new EmbedBuilder({
            title: 'Toplantı Paneline Hoşgeldiniz!',
            description: [
                '**Toplantı Başlat:** Tüm yetkililerin katılabileceği genel bir toplantı oluşturur. Kanal statüsü ⏳ Bekliyor olarak ayarlanır. Toplantı başladığında statü 🟢 Başladı olarak güncellenir ve katılım sağlayan yetkililerin ID\'leri kaydedilir. Toplantıyı bitirdiğinizde statü 🔴 Sona Erdi olarak güncellenir. Toplantı bitiminden 30 saniye sonra kanal otomatik olarak silinir.',
                '',
                '**Toplantı Bitir:** Genel toplantıyı sona erdirir. Statü 🔴 Sona Erdi olarak güncellenir ve kanal 30 saniye içinde otomatik olarak silinir.',
                '',
                '**Bireysel Başlat:** Sadece kendinizin katılacağı özel bir toplantı oluşturur. Statü ⏳ Bekliyor olarak ayarlanır ve başlattığınızda 🟢 Başladı olarak güncellenir. Katılım sağladığınız kişiler kaydedilir.',
                '',
                '**Bireysel Bitir:** Kendi başlattığınız bireysel toplantıyı sonlandırır. Statü 🔴 Sona Erdi olarak güncellenir ve 30 saniye sonra kanal otomatik olarak silinir.'
            ].join('\n')
        })

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('meeting:start')
                    .setLabel('Toplantı Başlat')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId('meeting:end')
                    .setLabel('Toplantı Bitir')
                    .setStyle(ButtonStyle.Danger)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('meeting:start-private')
                    .setLabel('Bireysel Başlat')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId('meeting:end-private')
                    .setLabel('Bireysel Bitir')
                    .setStyle(ButtonStyle.Danger)
            );

        await message.channel.send({
            embeds: [embed],
            components: [row, row2],
            allowedMentions: { parse: [] }
        });
    },
};
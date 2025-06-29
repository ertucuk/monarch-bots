const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    Name: 'görevpanel',
    Aliases: ['görev-panel'],
    Description: 'Görev paneli',
    Usage: 'görevpanel',
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

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('task:public')
                .setLabel(' \u200B \u200B Public Görevi \u200B \u200B ')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('task:streamer')
                .setLabel(' \u200B \u200B Streamer Görevi \u200B \u200B ')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('task:staff')
                .setLabel(' \u200B \u200B Yetkili Çekme Görevi \u200B \u200B ')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('task:message')
                .setLabel(' \u200B \u200B Mesaj Görevi \u200B \u200B ')
                .setStyle(ButtonStyle.Secondary),
        );

        if (message) message.delete().catch(() => { });
        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    title: 'Görevini Seç',
                    description: [
                        `Merhaba Görev seçme kanalına hoş geldin!`,

                        `Kendi ilgi alanına göre aşağıda ki butonlardan görev seçebilirsin. Seçtiğiniz görev o alana ağırlıklı olmak üzere diğer alanlardan da görevler içerir.`,

                        `📋 __Seçebileceğiniz Görevler :__`,

                        `${await client.getEmoji('point')} \` Public Görevi        : \` Public odalarda saat kasma görevidir. Bu görevde public odalar içerisinde AFK olarak geçirdiğiniz süreler sayılmamaktadır.`,
                    
                        `${await client.getEmoji('point')} \` Streamer Görevi      : \` Streamer odalarda saat kasma görevidir. Bu görevde Streamer odaları içerisinde AFK olarak geçirdiğiniz süreler sayılmamaktadır.`,
 
                        `${await client.getEmoji('point')} \` Yetkili Çekme Görevi : \` Sunucumuzda yetkili çekme görevidir. Çektiğiniz yetkililerin yan hesap olmaması gerekmektedir. Çektiğiniz yetkilileri .**yetkili @etiket** veya **.yetkili ID** komutu ile takımınıza almanız gerekir. Yan hesap tespiti halinde yaptırım uygulanabilir.`,

                        `${await client.getEmoji('point')} \` Mesaj Görevi         : \` Sohbet odalarında mesaj atma görevidir. Bu görevde sohbet odalarında mesaj atarak görevinizi tamamlayabilirsiniz.`,
                    ].join('\n\n'),
                })
            ],
            components: [row]
        });
    },
};
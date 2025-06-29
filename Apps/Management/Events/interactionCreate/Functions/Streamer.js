const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, codeBlock } = require('discord.js');

module.exports = async function Streamer(client, interaction, route, ertu) {
    if (route === 'appeal') {
        if (!ertu.settings.streamerRole) return interaction.reply({ content: 'Streamer rolü ayarlanmamış.', ephemeral: true });

        const member = interaction.guild?.members.cache.get(interaction.user.id);
        if (member.roles.cache.has(ertu.settings.streamerRole)) return interaction.reply({ content: 'Zaten streamer rolüne sahipsiniz.', ephemeral: true });

        const modal = new ModalBuilder({
            custom_id: 'streamer:modal',
            title: 'Streamer Başvuru Paneli',
            components: [
                new ActionRowBuilder({
                    components: [
                        new TextInputBuilder({
                            customId: 'test',
                            label: 'SpeedTest Result URL',
                            style: TextInputStyle.Short,
                            placeholder: 'https://www.speedtest.net/result/0000000000',
                        })
                    ]
                })
            ]
        });

        await interaction.showModal(modal);
    }

    if (route === 'modal') {
        await interaction.deferReply({ ephemeral: true });
        const modalInteraction = interaction;
        const resultURL = modalInteraction.fields.getTextInputValue('test');

        if (!resultURL.startsWith('https://www.speedtest.net/result/')) return modalInteraction.editReply({ content: 'Lütfen geçerli bir SpeedTest sonucu linki giriniz.' });
        const member = interaction.guild?.members.cache.get(interaction.user.id);

        const result = await client.functions.speedTest(resultURL);
        if (result.upload < 4) return modalInteraction.editReply({ content: `${await client.getEmoji('mark')} Başvuru yapabilmeniz için en az 4mbps upload hızına sahip olmalısınız.` });

        modalInteraction.editReply({ content: `${await client.getEmoji('check')} Yayıncı başvurunuz sistemimiz tarafından değerlendirilmiş ve onaylanmıştır. Bu kapsamda, sunucumuzdaki Yayıncı rolü hesabınıza tanımlanmıştır.` });
        member.roles.add(ertu.settings.streamerRole).catch(() => null);

        const channel = interaction.guild.channels.cache.find(c => c.name === 'streamer-başvuruları');
        if (channel) channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.getColor('random'),
                    title: 'Streamer Başvuru',
                    description: codeBlock('yaml', [
                        '# Başvuru Bilgileri',
                        `→ Kullanıcı: ${member.user.username} (${member.id})`,
                        `→ Upload Hızı: ${result.upload}mbps`,
                        `→ Download Hızı: ${result.download}mbps`,
                        `→ Tarih: ${client.functions.date(Date.now())}`,
                    ].join('\n')),
                    image: { url: resultURL + '.png' },
                    footer: { text: `${interaction.guild.name} | Created By Ertu` },
                    timestamp: new Date()
                })
            ]
        });
    }
}
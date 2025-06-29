const { PermissionsBitField: { Flags }, ActionRowBuilder, ButtonBuilder, ButtonStyle, bold, EmbedBuilder } = require('discord.js');

module.exports = {
    Name: 'sorunrapor',
    Aliases: [],
    Description: 'Sorun rapor paneli',
    Usage: 'sorunrapor',
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

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'solver:start',
                    label: 'Sorun Çözme Başlat',
                    style: ButtonStyle.Success,
                }),

                new ButtonBuilder({
                    custom_id: 'solver:end',
                    label: 'Sorun Çözme Bitir',
                    style: ButtonStyle.Danger,
                }),
            ],
        });

        message.delete().catch(() => { });
        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    author: { name: 'Sorun Çözme Sistemi', icon_url: message.guild.iconURL({ dynamic: true }) },
                    description: [
                        `${bold(`${message.guild?.name || 'ertu'}`)} sorun çözme paneline hoşgeldiniz,`,
                        '',
                        `- **Başlat** butonuna basarak bulunduğunuz sesli kanalda bir sorun çözme oturumu başlatabilirsiniz.`,
                        `- Sorun çözüldüğünde **Bitir** butonuna basarak oturumu sonlandırabilirsiniz.  `,
                        `- Bu işlemler, yetki puanınızı artırmak için sistem tarafından otomatik olarak kaydedilecektir. Unutmayın, dürüstlük ve disiplin bu sistemin temel taşıdır!`
                    ].join('\n'),
                })
            ],
            components: [row],
        })
    },
};
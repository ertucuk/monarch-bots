const { PermissionsBitField: { Flags }, ActionRowBuilder, ButtonBuilder, ButtonStyle, bold, EmbedBuilder } = require('discord.js');

module.exports = {
    Name: 'sorunçözme',
    Aliases: [],
    Description: 'Sorun çözücü çağırır.',
    Usage: 'sorunçözme',
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
                    custom_id: 'solver:request',
                    label: 'Yetkili Çağır',
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

        message.delete().catch(() => { });
        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    author: { name: 'Sorun Çözücü Çağırma Sistemi', icon_url: message.guild.iconURL({ dynamic: true }) },
                    description: [
                        `${bold(`${message.guild?.name || 'ertu'}`)} sorun çözücü çağırma paneline hoşgeldiniz,`,
                        '',
                        `- Lütfen gereksiz yere sorun çözme kanalını kullanmayınız.`,
                        `- Sorun çözme butonuna bastıktan sonra **1 saat** sonra tekrar kullanabilirsiniz.`,
                        `- Herhangi bir sorun veya şikayetiniz varsa ve bu şikayet Kurucuları ilgilendiren bir konuysa lütfen **Sorun Çözme Liderleri** ile iletişime geçiniz.`
                    ].join('\n'),
                })
            ],
            components: [row],
        })
    },
};
const { PermissionsBitField: { Flags }, ActionRowBuilder, ButtonBuilder, ButtonStyle, bold } = require('discord.js');

module.exports = {
    Name: 'fastlogin',
    Aliases: ['login', 'invasion'],
    Description: 'Doğrulama mesajını attırırsınız.',
    Usage: 'fastlogin',
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
                    custom_id: 'check:account',
                    label: 'Doğrula',
                    style: ButtonStyle.Success,
                }),
            ],
        });

        message.delete().catch(() => { });
        message.channel.send({
            content: [
                `${bold(`Merhaba Kullanıcı;`)}`,

                `Sunucumuz şuan çok hızlı giriş işlemi yapıldığı için rol dağıtımı durduruldu. Aşağıdaki butona tıklayarak bot hesap olmadığını doğrulayıp sunucuda gerekli rollerini alabilirsin. Eğer yanlış bir durum olduğunu düşünüyorsan sağ taraftaki yetkililere yazmaktan çekinme!`,
            ].join('\n\n'),
            components: [row],
        })
    },
};
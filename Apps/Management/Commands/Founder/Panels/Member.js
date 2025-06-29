const { PermissionsBitField: { Flags }, ActionRowBuilder, ButtonBuilder, ButtonStyle, bold, inlineCode } = require('discord.js');

module.exports = {
    Name: 'memberpanel',
    Aliases: ['userpanel', 'usrpanel'],
    Description: 'Kullanıcı panelini açar.',
    Usage: 'memberpanel',
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

        const rowOne = new ActionRowBuilder({
            components: [
                new ButtonBuilder()
                    .setCustomId('member:I')
                    .setLabel(' \u200B \u200B I \u200B \u200B ')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('member:II')
                    .setLabel(' \u200B \u200B II \u200B \u200B ')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('member:III')
                    .setLabel(' \u200B \u200B III \u200B \u200B ')
                    .setStyle(ButtonStyle.Secondary)
            ]
        })

        const rowTwo = new ActionRowBuilder({
            components: [
                new ButtonBuilder()
                    .setCustomId('member:IV')
                    .setLabel(' \u200B \u200B IV \u200B \u200B ')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('member:V')
                    .setLabel(' \u200B \u200B V \u200B \u200B ')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('member:VI')
                    .setLabel(' \u200B \u200B VI \u200B \u200B ')
                    .setStyle(ButtonStyle.Secondary)
            ]
        });

        const rowThree = new ActionRowBuilder({
            components: [
                new ButtonBuilder()
                    .setCustomId('member:VII')
                    .setLabel(' \u200B \u200B VII \u200B \u200B ')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('member:VIII')
                    .setLabel(' \u200B VIII \u200B \u200B ')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('member:IX')
                    .setLabel(' \u200B \u200B IX \u200B \u200B ')
                    .setStyle(ButtonStyle.Secondary)
            ]
        });

        message.delete().catch(() => { })
        message.channel.send({
            content: [
                `### Merhaba ${bold(inlineCode(message.guild?.name || 'Ertu'))} kullanıcı paneline hoşgeldiniz.`,
                `Sunucu içerisi yapmak istediğiniz işlem veya ulaşmak istediğiniz bilgi için gerekli butonlara tıklamanız yeterli olucaktır!`,
                '',
                `**1:** \`Sunucuya giriş tarihinizi öğrenin.\``,
                `**2:** \`Hesabınızın açılış tarihini öğrenin.\``,
                `**3:** \`Üstünüzde bulunan rollerin listesini alın.\``,
                '',
                `**4:** \`Davet bilgilerinizi öğrenin.\``,
                `**5:** \`Siciliniz hakkında bilgi alın.\``,
                `**6:** \`İsim değiştirme. (Sadece booster)\``,
                '',
                `**7:** \`Sunucudaki eski isim bilgilerinizi görüntüleyin.\``,
                `**8:** \`Ceza puanınızı öğrenin.\``,
                `**9:** \`Devam eden cezanız (varsa) hakkında bilgi alın.\``,
            ].join('\n'),
            components: [rowOne, rowTwo, rowThree]
        })
    },
};
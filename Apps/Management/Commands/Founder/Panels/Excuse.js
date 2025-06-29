const { ActionRowBuilder, ButtonBuilder, ButtonStyle, bold } = require('discord.js');

module.exports = {
    Name: 'mazeretpanel',
    Aliases: [],
    Description: 'Mazaret Panel atar',
    Usage: 'mazeretpanel',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'excuse:send',
                    label: 'Mazeret Bildir',
                    style: ButtonStyle.Danger,
                    emoji: { id: '1379423396617523210' },
                }),
            ],
        });

        message.delete().catch(() => { });
        message.channel.send({
            embeds: [
                embed.setDescription([
                   '> **__Mazeret Kullanımı Hakkında__**',
                   '',
                   'Mazeret, yetkili olduğunuz görevleri yerine getiremeyeceğiniz veya aktif olamayacağınız zamanlar için verilen bir haftalık izindir. Bu izni bir hafta boyunca kullanıp kullanmamak tamamen size bağlıdır. Bu süre zarfında yerine getirmeniz gereken görevler, mazeret izni süresince sizden beklenmez.',
                   '',
                   '> **__Mazeretler iki türde verilmektedir:__**',
                   '',
                   '1. **Toplantı Mazereti:** Sunucu içindeki toplantılara katılamama durumunda verilen mazerettir. Bu mazeret ayda en fazla bir kez alınabilir. Bir kereden fazla alınamaz.',
                   '2. **Genel Mazeret:** 5 haftada bir kez, 1 hafta boyunca alınabilen bir izindir. Sınav, ameliyat, kaza, yurt dışı veya şehir dışı gibi belirli durumlar için verilir.',
                   '',
                   '> **__Mazeret Süresi Uzatma:__**',
                   '',
                   'Eğer 1 hafta geçmesine rağmen sorununuz devam ediyorsa, bu durumu mazeret sorumlusuna bildirmeniz gerekmektedir. Bu durumda üzerinizdeki yetkiler alınır ve geri döndüğünüzde tekrar verilir.'
                ].join('\n')),
            ],
            components: [row],
        })
    },
};
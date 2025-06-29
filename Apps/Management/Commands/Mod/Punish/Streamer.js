const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
    Name: 'scezalı',
    Aliases: ['scezali', 'stceza'],
    Description: 'Belirlenen üyeye streamer yasağı uygular.',
    Usage: 'scezalı <@User/ID>',
    Category: 'Moderation',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        if (!member) {
            client.embed(message, `Kullanıcı bulunamadı!`);
            return;
        }

        const isVictimStaff = ertu.settings.staffs.some(role => member.roles.cache.has(role));
        const isAuthorStaff = ertu.settings.staffs.some(role => message.member.roles.cache.has(role));

        if (member) {
            if (client.functions.checkUser(message, member)) return;
            if (isAuthorStaff && isVictimStaff) {
                client.embed(message, 'Yetkili bir kullanıcıyı cezalandıramazsınız.');
                return;
            }
            if (member.roles.cache.has(ertu.settings.streamerPenaltyRole)) {
                client.embed(message, 'Kullanıcı zaten cezalı.');
                return;
            }
        };

        const limit = client.functions.checkLimit(
            message,
            message.author.id,
            'Stream',
            5,
            ms('1h'),
        );

        if (limit.hasLimit) {
            client.embed(
                message,
                `Atabileceğiniz maksimum streamer ceza limitine ulaştınız. Komutu ${limit.time} sonra tekrar deneyebilirsiniz.`,
            );
            return;
        };

        const penaltys = [
            {
                label: "2'den fazla mute açmak.",
                description: 'Ceza Süresi: 1 gün',
                value: 1,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
            {
                label: 'Oda sahibini susturmak.',
                description: 'Ceza Süresi: 1 gün',
                value: 2,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
            {
                label: 'İzinsiz açılan yayını/kamerayı kapatmamak.',
                description: 'Ceza Süresi: 1 gün',
                value: 3,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
            {
                label: 'Uyarıya rağmen Voice Mute Açmak.',
                description: 'Ceza Süresi: 1 gün',
                value: 4,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
            {
                label: 'Oda sahibinden izinsiz odadaki kişiye mute atmak.',
                description: 'Ceza Süresi: 1 gün',
                value: 5,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
            {
                label: 'Yan hesapla oda tutmak.',
                description: 'Ceza Süresi: 2 gün',
                value: 6,
                emoji: { id: '1265260101284003874' },
                time: '2d'
            },
            {
                label: 'Oda sahibinin istememesine rağmen odada durmak.',
                description: 'Ceza Süresi: 1 gün',
                value: 7,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
        ]

        const question = await message.reply({
            embeds: [
                embed.setDescription(
                    `Aşağıda bulunan menüden kullanıcıya streamer cezası vermek için uygun olan ceza sebebini seçiniz.` 
                ),
            ],

            components: [
                new ActionRowBuilder({
                    components: [
                        new StringSelectMenuBuilder({
                            custom_id: 'streamerPenalty',
                            placeholder: 'Sebep seçiniz...',
                            options: penaltys.map((x) => ({
                                label: x.label,
                                value: x.value.toString(),
                                description: x.description,
                                emoji: x.emoji,
                            })),
                        }),
                    ],
                }),
            ],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 2,
        });

        collector.on('collect', async (i) => {
            i.deferUpdate();
            const data = penaltys.find((x) => x.value.toString() === i.values[0]);
            if (!data) return;

            member.punish({
                type: 'Streamer',
                message: message,
                question: question,
                ertu: ertu,
                reason: data.label,
                timing: ms(data.time),
            });
        });
    },
};

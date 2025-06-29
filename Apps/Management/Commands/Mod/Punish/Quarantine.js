
const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
    Name: 'quarantine',
    Aliases: ['jail', 'cezalı', 'karantina'],
    Description: 'Sunucuda taşkınlık yaratan bir kullanıcıya karantina cezası vermenizi sağlar.',
    Usage: 'jail <@User/ID>',
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
            if (member.roles.cache.has(ertu.settings.quarantineRole)) {
                client.embed(message, 'Kullanıcı zaten cezalı.');
                return;
            }
        };

        const limit = client.functions.checkLimit(
            message,
            message.author.id,
            'Qurantine',
            ertu.settings.jailLimit ? Number(ertu.settings.jailLimit) : 5,
            ms('1h'),
        );

        if (limit.hasLimit) {
            client.embed(
                message,
                `Atabileceğiniz maksimum ceza limitine ulaştınız. Komutu ${limit.time} sonra tekrar deneyebilirsiniz.`,
            );
            return;
        };

        const penaltys = [
            {
                label: 'Sunucuyu kötülemek.',
                description: 'Ceza Süresi: 1 gün',
                value: 1,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
            {
                label: 'Mikrofon-kulaklık hatasını kullanmak.',
                description: 'Ceza Süresi: 1 gün',
                value: 2,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
            {
                label: 'Public odalara müzik botu çekmek.',
                description: 'Ceza Süresi: 1 gün',
                value: 3,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
            {
                label: 'Kamera açılan odalarda fake kamera açmak.',
                description: 'Ceza Süresi: 1 gün',
                value: 4,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
            {
                label: 'Rahatsızlık vermek oda takibi.',
                description: 'Ceza Süresi: 1 gün',
                value: 5,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
            {
                label: 'Sorun çözme troll veya küfür.',
                description: 'Ceza Süresi: 1 gün',
                value: 6,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
            {
                label: 'Dini ve milli değerlerle dalga geçmek.',
                description: 'Ceza Süresi: 1 gün',
                value: 7,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
            {
                label: 'Boostu kötüye kullanma.',
                description: 'Ceza Süresi: 1 gün',
                value: 8,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            },
            {
                label: 'Abartılı şekilde şiddet içerikli tehdit söylemi.',
                description: 'Ceza Süresi: 7 gün',
                value: 9,
                emoji: { id: '1265260101284003874' },
                time: '7d'
            },
            {
                label: 'Cinsel taciz.',
                description: 'Ceza Süresi: 7 gün',
                value: 10,
                emoji: { id: '1265260101284003874' },
                time: '7d'
            },
            {
                label: 'Dini ve milli değerlere küfür.',
                description: 'Ceza Süresi: 7 gün',
                value: 11,
                emoji: { id: '1265260101284003874' },
                time: '7d'
            },
            {
                label: 'Terör propagandası yapmak.',
                description: 'Ceza Süresi: 7 gün',
                value: 12,
                emoji: { id: '1265260101284003874' },
                time: '7d'
            },
            {
                label: '4 Mute Jail',
                description: 'Ceza Süresi: 1 gün',
                value: 13,
                emoji: { id: '1265260101284003874' },
                time: '1d'
            }
        ]

        const question = await message.reply({
            embeds: [
                embed.setDescription(
                    `Aşağıda bulunan menüden kullanıcıyı karantinaya atmak için uygun olan ceza sebebini seçiniz.`
                ),
            ],

            components: [
                new ActionRowBuilder({
                    components: [
                        new StringSelectMenuBuilder({
                            custom_id: 'quarantine',
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
                type: 'Quarantine',
                message: message,
                question: question,
                ertu: ertu,
                reason: data.label,
                timing: ms(data.time),
            });
        });
    },
};
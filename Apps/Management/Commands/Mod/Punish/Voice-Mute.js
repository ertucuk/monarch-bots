const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
    Name: 'voicemute',
    Aliases: ['voice-mute', 'v-mute', 'vmute'],
    Description: 'Sunucudaki ses kanallarında kurallara aykırı davranan kullanıcıları cezalandırmanızı sağlar.',
    Usage: 'vmute <@User/ID>',
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
            if (member.roles.cache.has(ertu.settings.voiceMuteRole)) {
                client.embed(message, 'Kullanıcı susturulmuş.');
                return;
            }
        };

        const limit = client.functions.checkLimit(
            message,
            message.author.id,
            'Voice-Mute',
            ertu.settings.muteLimit ? Number(ertu.settings.muteLimit) : 5,
            ms('1h'),
        );

        if (limit.hasLimit) {
            client.embed(
                message,
                `Atabileceğiniz maksimum ses susturma limitine ulaştınız. Komutu ${limit.time} sonra tekrar deneyebilirsiniz.`,
            );
            return;
        };

        const penaltys = [
            {
                label: 'Ailevi değerlere küfür.',
                description: 'Ceza Süresi: 15 Dakika',
                value: '1',
                emoji: { id: '1265260101284003874' },
                time: '15m',
            },
            {
                label: 'Küfür, hakaret söylemi, kışkırtma.',
                description: 'Ceza Süresi: 10 Dakika',
                value: '2',
                emoji: { id: '1265260101284003874' },
                time: '10m',
            },
            {
                label: 'Bas açıp sövmek, Soundpadden küfür.',
                description: 'Ceza Süresi: 20 Dakika',
                value: '3',
                emoji: { id: '1265260101284003874' },
                time: '20m',
            },
            {
                label: 'Siyasi tartışmalar yapmak.',
                description: 'Ceza Süresi: 30 Dakika',
                value: '4',
                emoji: { id: '1265260101284003874' },
                time: '30m',
            },
            {
                label: 'Sunucu ismi vermek.',
                description: 'Ceza Süresi: 30 Dakika',
                value: '5',
                emoji: { id: '1265260101284003874' },
                time: '30m',
            },
            {
                label: 'Secret ve game odalarına izinsiz girmek.',
                description: 'Ceza Süresi: 1 Saat',
                value: '6',
                emoji: { id: '1265260101284003874' },
                time: '60m',
            },
            {
                label: 'Ses kanallarında cinsellik içeren konuşmalar yapmak.',
                description: 'Ceza Süresi: 1 Saat',
                value: '7',
                emoji: { id: '1265260101284003874' },
                time: '60m',
            },
            {
                label: 'Dini ve milli değerlerle dalga geçmek, ırkçılık.',
                description: 'Ceza Süresi: 1 Saat',
                value: '8',
                emoji: { id: '1265260101284003874' },
                time: '60m',
            },
        ]

        const question = await message.reply({
            embeds: [
                embed.setDescription(
                    `Aşağıda bulunan menüden ses kanallarından susturmak istediğiniz ${member} için uygun olan ceza sebebini seçiniz.`,
                ),
            ],

            components: [
                new ActionRowBuilder({
                    components: [
                        new StringSelectMenuBuilder({
                            custom_id: 'voiceMute',
                            placeholder: 'Sebep seçiniz...',
                            options: penaltys.map((x) => ({
                                label: x.label,
                                value: x.value,
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
            const data = penaltys.find((x) => x.value === i.values[0]);
            if (!data) return;

            member.punish({
                type: 'VoiceMute',
                message: message,
                question: question,
                ertu: ertu,
                reason: data.label,
                timing: ms(data.time),
            });
        });
    },
};
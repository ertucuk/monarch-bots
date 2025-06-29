const { ActionRowBuilder, bold, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, PermissionFlagsBits, roleMention } = require('discord.js');
const { StaffModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'yetkibaşlat',
    Aliases: ['yetkibaslat', 'yetki-baslat', 'yetki-başlat'],
    Description: 'Kullanıcıya yetkili rolü verir.',
    Usage: 'yetkibaşlat <@User/ID>',
    Category: 'Staff',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) return message.channel.send({ content: `Kullanıcı bulunamadı!` });
        if (member.user.bot) return message.channel.send({ content: `Botların verisi bulunamaz!` });
        if (member.id === message.author.id) return message.channel.send({ content: `Kendine yetki veremezsin!` });
        if (client.functions.checkUser(message, member)) return;

        if (!member.user.displayName.includes(ertu.settings.tag)) {
            message.channel.send({ content: `${await client.getEmoji('mark')} Belirttiğin kullanıcı tagımızı almadığı için yetki verilemez!` });
            return;
        }

        if (client.staff.check(member, ertu)) {
            return message.channel.send({ content: `${await client.getEmoji('mark')} Bu kullanıcı zaten yetkili!` });
        }

        const yonetimLider = '† Yönetim Lideri';
        const yetkiliAlimLideri = '† Yetkili Alım Lideri';
        const god = 'God';

        const showAcceptButton = !(
            message.member.roles.cache.some(r => [yonetimLider, yetkiliAlimLideri, god].includes(r.name)) ||
            message.member.permissions.has(PermissionFlagsBits.Administrator) ||
            ertu.settings.founders.some(x => message.member.roles.cache.has(x))
        );

        const document = await StaffModel.findOne({ user: member.id }) || { oldRanks: [] };
        const mappedData = document.oldRanks.map((r) => {
            const role = r.roles.find(role => ertu.staffRanks.some((rr) => rr.role === role));
            const date = client.timestamp(r.date);
            return `[${date}]: ${role && message.guild?.roles.cache.has(role) ? message.guild.roles.cache.get(role) : '[@bulunamadı](https://ertu.live)'}`;
        });

        const now = Date.now();
        const sortedRanks = ertu.staffRanks.filter(x => x.type === 'sub').sort((a, b) => a.point - b.point);
        const sortedRoles = [sortedRanks[0].role, ...sortedRanks[0].hammers];

        if (showAcceptButton) {
            const row = new ActionRowBuilder({
                components: [
                    new ButtonBuilder({
                        custom_id: 'accept',
                        label: 'Kabul Ediyorum',
                        style: ButtonStyle.Secondary,
                        emoji: { id: await client.getEmojiID('check') },
                    }),
                    new ButtonBuilder({
                        custom_id: 'deaccept',
                        label: 'Reddediyorum',
                        style: ButtonStyle.Secondary,
                        emoji: { id: await client.getEmojiID('mark') },
                    })
                ],
            });

            const question = await message.channel.send({
                content: `${member}, ${message.author} adlı yetkilimiz seni yetkiye davet etti!`,
                components: [row],
                embeds: mappedData.length ? [
                    new EmbedBuilder({
                        color: client.getColor('random'),
                        author: { name: message.author.tag, iconURL: message.author.displayAvatarURL({ extension: 'png', size: 4096 }) },
                        description: [
                            `- ${bold('GEÇMİŞ YETKİ DURUMU')}`,
                            mappedData.join('\n'),
                        ].join('\n'),
                    })
                ] : [],
            });

            const filter = (i) => i.user.id === member.id && ['accept', 'deaccept'].includes(i.customId);
            const collector = question.createMessageComponentCollector({
                filter,
                time: 1000 * 60 * 5,
                componentType: ComponentType.Button,
            });

            collector.on('collect', async (i) => {
                i.deferUpdate();

                if (i.customId === 'accept') {
                    collector.stop('ACCEPT');
                    question.edit({
                        content: `${await client.getEmoji('check')} ${member} yetkili olarak kabul edildi!`,
                        components: [],
                        embeds: [],
                    });

                    await member.roles.add(sortedRoles, `${message.author.username} tarafından yetki verildi!`);

                    const newRank = {
                        roles: sortedRoles,
                        date: now,
                        staff: message.author.id,
                        reason: 'Yetki verildi!',
                        up: true,
                    };

                    await StaffModel.updateOne(
                        { user: member.id },
                        {
                            $setOnInsert: { user: member.id },
                            $push: {
                                oldRanks: {
                                    $each: [newRank],
                                    $position: 0,
                                },
                            },
                        },
                        { upsert: true }
                    );

                    const orientationLog = await client.getChannel(client.data.logs.orientation, message);
                    const staffLog = await client.getChannel(client.data.logs.staff, message);
                    const staffButton = new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                custom_id: 'staff:' + member.id,
                                label: 'Yetkili ile ilgilen',
                                style: ButtonStyle.Primary,
                            }),
                        ],
                    });

                    const orientationRoles = message.guild.roles.cache.filter(role => role.name.toLowerCase().includes('rehber'));

                    if (orientationLog) {
                        orientationLog.send({
                            content: orientationRoles ? orientationRoles.map(r => roleMention(r.id)).join(' ') : '',
                            components: [staffButton],
                            embeds: [
                                new EmbedBuilder({
                                    color: client.getColor('random'),
                                    description: [
                                        `${member} adlı kullanıcıya ${message.author} tarafından yetki verildi!`,
                                        ' ',
                                        `→ Yetki veren: ${message.author}`,
                                        `→ Yetki verme tarihi: ${client.timestamp(now)}`,
                                        `→ Hesap oluşturma tarihi: ${client.timestamp(member.user.createdTimestamp)}`,
                                        `→ Sunucuya katılma tarihi: ${client.timestamp(member.joinedTimestamp)}`,
                                    ].join('\n'),
                                })
                            ],
                        });
                    };

                    if (staffLog) {
                        staffLog.send({
                            embeds: [
                                new EmbedBuilder({
                                    color: client.getColor('random'),
                                    description: [
                                        `${member} adlı kullanıcıya ${message.author} tarafından yetki verildi!`,
                                        ' ',
                                        `→ Yetki veren: ${message.author}`,
                                        `→ Yetki verme tarihi: ${client.timestamp(now)}`,
                                        `→ Verilen Yetkiler: ${roleMention(sortedRanks[0].role)} ${roleMention(sortedRanks[0].hammers)}`,
                                        `→ Hesap oluşturma tarihi: ${client.timestamp(member.user.createdTimestamp)}`,
                                        `→ Sunucuya katılma tarihi: ${client.timestamp(member.joinedTimestamp)}`,
                                    ].join('\n'),
                                })
                            ],
                        });
                    };

                    if (!client.staff.check(message.member, ertu)) return;
                    await client.staff.checkRank(client, message.member, ertu, { type: 'staffPoints', amount: 1, user: member.id, point: 50 });
                } else {
                    collector.stop('DEACCEPT');
                    question.edit({
                        content: `${await client.getEmoji('mark')} ${member} yetkili olarak reddedildi!`,
                        components: [],
                        embeds: [],
                    });
                }
            });

            collector.on('end', async (_, r) => {
                if (r === 'time') {
                    question.edit({
                        content: `${await client.getEmoji('mark')} İşlem süresi doldu!`,
                        components: [],
                        embeds: [],
                    });
                }
            });
            return;
        }

        await member.roles.add(sortedRoles, `${message.author.username} tarafından yetki verildi!`);

        const newRank = {
            roles: sortedRoles,
            date: now,
            staff: message.author.id,
            reason: 'Yetki verildi!',
            up: true,
        };

        await StaffModel.updateOne(
            { user: member.id },
            {
                $setOnInsert: { user: member.id },
                $push: {
                    oldRanks: {
                        $each: [newRank],
                    },
                },
            },
            { upsert: true }
        );

        const orientationLog = await client.getChannel(client.data.logs.orientation, message);
        const staffLog = await client.getChannel(client.data.logs.staff, message);
        const staffButton = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'staff:' + member.id,
                    label: 'Yetkili ile ilgilen',
                    style: ButtonStyle.Primary,
                }),
            ],
        });

        const orientationRoles = message.guild.roles.cache.filter(role => role.name.toLowerCase().includes('rehber'));

        if (orientationLog) {
            orientationLog.send({
                content: orientationRoles ? orientationRoles.map(r => roleMention(r.id)).join(' ') : '',
                components: [staffButton],
                embeds: [
                    new EmbedBuilder({
                        color: client.getColor('random'),
                        description: [
                            `${member} adlı kullanıcıya ${message.author} tarafından yetki verildi!`,
                            ' ',
                            `→ Yetki veren: ${message.author}`,
                            `→ Yetki verme tarihi: ${client.timestamp(now)}`,
                            `→ Hesap oluşturma tarihi: ${client.timestamp(member.user.createdTimestamp)}`,
                            `→ Sunucuya katılma tarihi: ${client.timestamp(member.joinedTimestamp)}`,
                        ].join('\n'),
                    })
                ],
            });
        };

        if (staffLog) {
            staffLog.send({
                embeds: [
                    new EmbedBuilder({
                        color: client.getColor('random'),
                        description: [
                            `${member} adlı kullanıcıya ${message.author} tarafından yetki verildi!`,
                            ' ',
                            `→ Yetki veren: ${message.author}`,
                            `→ Yetki verme tarihi: ${client.timestamp(now)}`,
                            `→ Verilen Yetkiler: ${roleMention(sortedRanks[0].role)} ${roleMention(sortedRanks[0].hammers)}`,
                            `→ Hesap oluşturma tarihi: ${client.timestamp(member.user.createdTimestamp)}`,
                            `→ Sunucuya katılma tarihi: ${client.timestamp(member.joinedTimestamp)}`,
                        ].join('\n'),
                    })
                ],
            });
        };

        message.reply({ content: `${await client.getEmoji('check')} ${member} adlı kullanıcıya yetki verildi!` });

        if (!client.staff.check(message.member, ertu)) return;
        await client.staff.checkRank(client, message.member, ertu, { type: 'staffPoints', amount: 1, user: member.id, point: 50 });
    },
};
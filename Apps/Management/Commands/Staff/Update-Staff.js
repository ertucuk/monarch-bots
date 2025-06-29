const { ActionRowBuilder, bold, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, PermissionFlagsBits, roleMention, StringSelectMenuBuilder } = require('discord.js');
const { StaffModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'yetki',
    Aliases: ['yetkili', 'yt'],
    Description: 'Kullanıcının yetkisini yükseltir veya düşürürsünüz.',
    Usage: 'yetki <@User/ID>',
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

        if (!client.staff.check(member, ertu)) {
            return message.channel.send({ content: `${await client.getEmoji('mark')} Bu kullanıcı yetkili değil!` });
        }

        const yonetimLider = '† Yönetim Lideri';
        const yetkiliAlimLideri = '† Yetkili Alım Lideri';
        const god = 'God';
        const owner = 'Owner.';
        const yetkiliAlimDenetleyici = '† Yetkili Alım Denetleyici';
        const yetkiliAlimSorumlusu = '† Yetkili Alım Sorumlusu';
        const yetkiliAlimDM = 'Yetkili Alım DM!';

        let maxRankRoleName = null;

        if (message.member.roles.cache.some(r => [yonetimLider, yetkiliAlimLideri, god, owner].includes(r.name)) || message.member.permissions.has(PermissionFlagsBits.Administrator) || ertu.settings.founders.some(x => message.member.roles.cache.has(x))) {
            maxRankRoleName = 'Dante';
        } else if (message.member.roles.cache.some(r => r.name === yetkiliAlimDenetleyici)) {
            maxRankRoleName = 'God Tier';
        } else if (message.member.roles.cache.some(r => r.name === yetkiliAlimSorumlusu)) {
            maxRankRoleName = 'Demon';
        } else if (message.member.roles.cache.some(r => r.name === yetkiliAlimDM)) {
            maxRankRoleName = 'Revoir';
        }

        const maxRankRoleObj = message.guild.roles.cache.find(r => r.name === maxRankRoleName);
        if (!maxRankRoleObj) {
            return message.channel.send({
                content: `${await client.getEmoji('mark')} Yetki yükseltimi yapamazsın.`
            });
        }

        const document = await StaffModel.findOne({ user: member.id }) || { oldRanks: [] };
        const mappedData = document.oldRanks.map((r) => {
            const role = r.roles.find(role => ertu.staffRanks.some((rr) => rr.role === role));
            const date = client.timestamp(r.date);
            return `[${date}]: ${role && message.guild?.roles.cache.has(role) ? message.guild.roles.cache.get(role) : '[@bulunamadı](https://ertu.live)'}`;
        });

        const subRow = new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'sub-selection',
                    placeholder: 'Alt Yetkiler',
                    options: ertu.staffRanks
                        .filter(r => message.guild?.roles.cache.has(r.role) && r.type === 'sub' && message.guild.roles.cache.get(r.role).position <= maxRankRoleObj.position)
                        .sort((a, b) => b.point - a.point)
                        .map(r => ({
                            value: r.role,
                            label: message.guild?.roles.cache.get(r.role)?.name,
                            description: `Puan: ${r.point}`,
                        }))
                }),
            ],
        });

        const middleRow = new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'middle-selection',
                    placeholder: 'Orta Yetkiler',
                    options: ertu.staffRanks
                        .filter(r => message.guild?.roles.cache.has(r.role) && r.type === 'middle' && message.guild.roles.cache.get(r.role).position <= maxRankRoleObj.position)
                        .sort((a, b) => b.place - a.place)
                        .map(r => ({
                            value: r.role,
                            label: message.guild?.roles.cache.get(r.role)?.name,
                            description: r.hammers ? r.hammers.map(h => message.guild?.roles.cache.get(h)?.name).join(', ') : 'Ekstra rol yok!',
                        }))
                }),
            ],
        });

        const topRow = new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'top-selection',
                    placeholder: 'Üst Yetkiler',
                    options: ertu.staffRanks
                        .filter(r => message.guild?.roles.cache.has(r.role) && r.type === 'top' && message.guild.roles.cache.get(r.role).position <= maxRankRoleObj.position)
                        .sort((a, b) => b.place - a.place)
                        .map(r => ({
                            value: r.role,
                            label: message.guild?.roles.cache.get(r.role)?.name,
                            description: r.hammers ? r.hammers.map(h => message.guild?.roles.cache.get(h)?.name).join(', ') : 'Ekstra rol yok!',
                        }))
                }),
            ],
        });

        let components = [];
        if (message.member.roles.cache.some(r => [yonetimLider, yetkiliAlimLideri, god, owner].includes(r.name)) || message.member.permissions.has(PermissionFlagsBits.Administrator) || ertu.settings.founders.some(x => message.member.roles.cache.has(x))) {
            components = [subRow, middleRow, topRow];
        } else if (message.member.roles.cache.some(r => r.name === yetkiliAlimDenetleyici)) {
            components = [subRow, middleRow];
        } else if (message.member.roles.cache.some(r => r.name === yetkiliAlimSorumlusu)) {
            components = [subRow];
        } else if (message.member.roles.cache.some(r => r.name === yetkiliAlimDM)) {
            components = [subRow];
        }

         const question = await message.channel.send({
            components,
            embeds: mappedData.length ? [
                new EmbedBuilder({
                    color: client.getColor('random'),
                    author: { name: message.author.tag, iconURL: message.author.displayAvatarURL({ extension: 'png', size: 4096 }) },
                    description: [
                        `${bold('GEÇMİŞ YETKİ DURUMU')}`,
                        mappedData.join('\n'),
                    ].join('\n'),
                })
            ] : [],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
        });

        collector.on('collect', async (i) => {
            const { currentRank } = client.staff.getRank(member, ertu);
            const newRank = ertu.staffRanks.find((r) => r.role === i.values[0]);
            if (currentRank?.role === newRank?.role) return i.reply({ content: `${await client.getEmoji('mark')} Belirttiğin kullanıcı zaten bu role sahip!`, ephemeral: true });

            i.deferUpdate();
            question.edit({
                content: `${member} adlı kullanıcıya yetki verildi!`,
                components: [],
                embeds: [],
            });

            const now = Date.now();
            const newData = {
                roles: [newRank?.role, ...newRank?.hammers],
                date: now,
                staff: message.author.id,
                reason: 'Yetki güncellendi!',
                up: true,
            };

            await StaffModel.updateOne(
                { user: member.id },
                {
                    $push: {
                        oldRanks: newData,
                    },
                    $set: {
                        roleStartAt: now,

                        inviteds: [],
                        badges: [],
                        staffs: [],
                        bonuses: [],

                        totalGeneralMeeting: 0,
                        totalIndividualMeeting: 0,
                        totalStaffMeeting: 0,

                        dailyPoints: 0,
                        bonusPoints: 0,
                        totalPoints: 0,
                        registerPoints: 0,
                        publicPoints: 0,
                        afkPoints: 0,
                        streamerPoints: 0,
                        activityPoints: 0,
                        messagePoints: 0,
                        invitePoints: 0,
                        staffPoints: 0,
                        taggedPoints: 0,
                    },
                },
                { upsert: true }
            );

            /*if (currentRank?.badges) await member.roles.remove(currentRank.badges.map(b => b.role));
            if (newRank?.badges) await member.roles.add(newRank.badges[0].role)*/

            if (currentRank?.role) await member.roles.remove(currentRank.role);
            if (currentRank?.hammers) await member.roles.remove(currentRank?.hammers);
          
            await member.roles.add(newRank?.role);
            await member.roles.add(newRank.hammers);

            const logChannel = await client.getChannel(client.data.logs.upstaff, message);

            if (logChannel) logChannel.send({
                embeds: [
                    new EmbedBuilder({
                        color: client.getColor('random'),
                        description: [
                            `${member} üyesinin yetkisi ${message.author} tarafından güncellendi!`,
                            ' ',
                            `→ Yetki veren: ${message.author}`,
                            `→ Yetki verme tarihi: ${client.timestamp(now)}`,
                            `→ Hesap oluşturma tarihi: ${client.timestamp(member.user.createdTimestamp)}`,
                            `→ Sunucuya katılma tarihi: ${client.timestamp(member.joinedTimestamp)}`,
                        ].join('\n'),
                    })
                ],
            });
        });
    },
};
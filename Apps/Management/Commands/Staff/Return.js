const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js')
const { StaffModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'return',
    Aliases: [],
    Description: 'Kullanıcıyı geri yetkiye döndürür.',
    Usage: 'return <@User/ID>',
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

        if (message.author.id !== member.id && client.functions.checkUser(message, member)) return;

        const document = await StaffModel.findOne({ user: member.id });
        if (!document || !document.oldRanks.length) return message.channel.send({ content: 'Kullanıcının eski yetkili verisi bulunmuyor!' });

        const oldRank = document.oldRanks[document.oldRanks.length - 1];

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'accept',
                    label: 'Kabul Et',
                    style: ButtonStyle.Success,
                }),

                new ButtonBuilder({
                    custom_id: 'cancel',
                    label: 'Reddet',
                    style: ButtonStyle.Danger,
                }),
            ]
        });

        const msg = await message.channel.send({
            content: member.toString(),
            embeds: [embed.setDescription(`${message.author} adlı üye seni geri yetkili yapmak istiyor. Onaylıyor musun?`)],
            components: [row]
        });

        const filter = (i) => i.user.id === member.id;
        const collector = msg.createMessageComponentCollector({ filter: filter, time: 60000, componentType: ComponentType.Button });

        collector.on('collect', async (i) => {
            i.deferUpdate();
            if (i.customId === 'accept') {
                await member.roles.add(oldRank.roles, `${message.author.username} - Tarafınfan yetkiye geri alındı!`).catch(() => { });

                await msg.edit({
                    content: member.toString(),
                    embeds: [embed.setDescription(`${member} adlı üye ${message.author} tarafından yetkiye geri alındı! Başarılar dileriz.`)],
                    components: []
                });

                collector.stop('accept');

                await client.staff.checkRank(client, message.member, ertu, { type: 'RETURN', amount: 1 });
                await StaffModel.updateOne(
                    { user: member.id },
                    {
                        $set: {
                            roleStartAt: new Date(Date.now()),

                            inviteds: [],
                            badges: [],
                            staffs: [],
                            bonuses: [],
                            taggeds: [],

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

                        $push: {
                            oldRanks: {
                                roles: oldRank.roles,
                                date: Date.now(),
                                staff: message.author.id,
                                reason: 'Yetkiye geri alındı!',
                                up: true
                            }
                        },
                    },
                );

                if (!client.staff.check(message.member, ertu)) return collector.stop('done');

            } else {
                msg.edit({
                    content: member.toString(),
                    embeds: [embed.setDescription(`${member} adlı üyenin yetkisi geri alınma talebi reddedildi!`)],
                    components: []
                });
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'accept') return;
            await msg.edit({ components: [client.functions.timesUp()] })
        });
    },
};
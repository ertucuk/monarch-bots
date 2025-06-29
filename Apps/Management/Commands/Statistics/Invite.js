const { PermissionsBitField: { Flags }, bold, codeBlock, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas')
const moment = require('moment');
moment.locale('tr');
const { table } = require('table');

const collectorData = new Map();

module.exports = {
    Name: 'davet',
    Aliases: ['invite', 'davetler', 'invites', 'davetlerim'],
    Description: 'Kullanıcının davetlerini gösterir.',
    Usage: 'davet',
    Category: 'Statistics',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!member) {
            client.embed(message, `Kullanıcı bulunamadı!`);
            return;
        }

        if (member.user.bot) {
            client.embed(message, 'Botların verisi bulunamaz!');
            return;
        }

        const document = await UserModel.findOne({ id: member.id });
        if (!document) {
            client.embed(message, 'Veri bulunmuyor.');
            return;
        }

        const invitedUsers = await UserModel.find({ inviter: member.id }).select('id');

        const daily = invitedUsers.filter((i) =>
            message.guild?.members.cache.has(i.id) &&
            1000 * 60 * 60 * 24 >= (Date.now() - (message.guild?.members.cache.get(i.id)?.joinedTimestamp))
        );

        const weekly = invitedUsers.filter((i) =>
            message.guild?.members.cache.has(i.id) &&
            1000 * 60 * 60 * 24 * 7 >= (Date.now() - (message.guild?.members.cache.get(i.id)?.joinedTimestamp))
        );

        const monthly = invitedUsers.filter((i) =>
            message.guild?.members.cache.has(i.id) &&
            1000 * 60 * 60 * 24 * 30 >= (Date.now() - (message.guild?.members.cache.get(i.id)?.joinedTimestamp))
        );

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'home',
                    label: 'Ana Sayfa',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    custom_id: 'info',
                    style: ButtonStyle.Secondary,
                    label: 'Davet Ettiği Kişiler',
                    disabled: (invitedUsers.length < 1),
                })
            ]
        });

        const homeEmbed = embed.setDescription(`Merhaba ${member} sunucuda toplamda ${bold(((document.invitesData.normal || 0) + (document.invitesData.suspect || 0)).toString())} kişi davet etmiş.`)
            .addFields(
                {
                    name: 'Günlük Davetler',
                    value: codeBlock('fix', daily.length.toString()),
                    inline: true
                },
                {
                    name: 'Haftalık Davetler',
                    value: codeBlock('fix', weekly.length.toString()),
                    inline: true
                },
                {
                    name: 'Aylık Davetler',
                    value: codeBlock('fix', monthly.length.toString()),
                    inline: true
                },
                {
                    name: 'Davet Ettiği Bazı Kişiler',
                    value: codeBlock('yaml', invitedUsers.slice(0, 10).map((i) => {
                        const m = message.guild?.members.cache.get(i.id);
                        if (!m) return;
                        return `→ ${m.displayName} [${m.user.username}]`
                    }).join('\n') || 'Bulunamadı')
                }
            )

        const question = await message.reply({
            embeds: [homeEmbed],
            components: [row]
        });

        const collector = question.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 60000
        });

        collector.on('collect', async (i) => {
            let datax = [];
            let config = {
                border: {
                    topBody: ``,
                    topJoin: ``,
                    topLeft: ``,
                    topRight: ``,

                    bottomBody: ``,
                    bottomJoin: ``,
                    bottomLeft: ``,
                    bottomRight: ``,

                    bodyLeft: `│`,
                    bodyRight: `│`,
                    bodyJoin: `│`,

                    joinBody: ``,
                    joinLeft: ``,
                    joinRight: ``,
                    joinJoin: ``,
                },
            };

            invitedUsers.map(async (x) => {
                let member = message.guild?.members.cache.get(x.id)
                let docs = document.invites.find((i) => i.user === x.id);
                if (member)
                    datax.push([
                        member.id,
                        member.user.username,
                        moment(docs?.date).format('LLL'),
                        member ? member.roles.highest.position >= message.guild?.roles.cache.get(ertu.settings.minStaffRole)?.position ? 'Yetkili' : 'Değil' : 'Sunucuda değil',
                        member ? 'Sunucuda' : 'Sunucuda değil'
                    ]);
            });

            const chunks = client.functions.chunkArray(datax, 10);
            const start = ['ID', 'Kullanıcı adı', 'Tarih', 'Yetkili mi?', 'Sunucuda Mı?']

            await i.reply({
                content: codeBlock('yaml', table([start, ...chunks[0]], config)),
                ephemeral: true
            });

            for (const chunk of chunks.slice(1)) {
                await i.followUp({
                    content: codeBlock('yaml', table([start, ...chunk], config)),
                    ephemeral: true
                });
            }
        });

        collector.on('end', async () => {
            collectorData.delete('info');
            question.edit({
                components: [client.functions.timesUp()]
            });
        });
    },
};
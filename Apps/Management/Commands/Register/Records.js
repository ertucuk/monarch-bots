const { PermissionsBitField: { Flags }, codeBlock, ComponentType, bold } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas/')
const moment = require('moment');
moment.locale('tr');

module.exports = {
    Name: 'kayıtlarım',
    Aliases: ['teyit', 'kayıtbilgi', 'kayitbilgi', 'kayit-bilgi', 'teyit-bilgi', 'kayitlarim', 'kayıtlarım', 'teyitlerim', 'teyitler'],
    Description: 'Belirtilen üyenin teyit bilgilerini gösterir.',
    Usage: 'kayıtlarım <@User/ID>',
    Category: 'Register',
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

        const document = await UserModel.findOne({ id: member.id });
        if (!document || !document.records.length) {
            client.embed(message, 'Kullanıcının verisi bulunmuyor.');
            return;
        };

        let page = 1;
        const totalData = Math.ceil(document.records.length / 5);

        const mappedData = await Promise.all(document.records.reverse().map(async (x) => {
            const registeredUser = message.guild.members.cache.get(x.user);
            return codeBlock(
                'fix',
                [
                    `Cinsiyet: ${x.gender}`,
                    `Kullanıcı: ${registeredUser ? registeredUser.user.username + ` (${x.user})` : x.user}`,
                    `Tarih: ${moment(x.date).fromNow()}`,
                ].filter(Boolean).join('\n'),
            );
        }));

        const question = await message.channel.send({
            embeds: [embed.setDescription(`Toplam ${bold(document.records.length)} kayıt bulunmakta.\n` + mappedData.slice(0, 5).join(''))],
            components: document.records.length > 5 ? [client.getButton(page, totalData)] : [],
        });

        if (5 > document.records.length) return;

        const filter = (i) => i.user.id === message.author.id && i.isButton();
        const collector = question.createMessageComponentCollector({
            filter,
            time: 30000,
            componentType: ComponentType.Button,
        });

        collector.on('collect', (i) => {
            i.deferUpdate();

            if (i.customId === 'first') page = 1;
            if (i.customId === 'previous') page -= 1;
            if (i.customId === 'next') page += 1;
            if (i.customId === 'last') page = totalData;

            question.edit({
                embeds: [embed.setDescription(`Toplam ${bold(document.records.length)} kayıt bulunmakta.\n` + mappedData.slice(page === 1 ? 0 : page * 5 - 5, page * 5).join(''))],
                components: [client.getButton(page, totalData)],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                question.edit({ components: [client.functions.timesUp()] });
            }
        });
    },
};
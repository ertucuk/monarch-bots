const { userMention, roleMention, ComponentType } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'rollog',
    Aliases: ['rl', 'rlog'],
    Description: 'Belirtilen kullanıcının rol değişimlerini gösterir.',
    Usage: 'rollog <@User/ID>',
    Category: 'Admin',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {

        const types = {
            'add': `${await client.getEmoji('up')}`,
            'remove': `${await client.getEmoji('down')}`,
        };

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!member) return client.embed(message, 'Geçerli bir üye belirtmelisiniz.');

        const document = await UserModel.findOne({ id: member.id });
        if (!document || !document.roleLogs.length) return client.embed(message, 'Belirtilen üyenin rol değişim kaydı bulunamadı.');

        let page = 1;
        const totalPages = Math.ceil(document.roleLogs.length / 10);
        const datas = document.roleLogs.reverse().map(d =>
            `${d.staff ? userMention(d.staff) : 'Bulunamadı.'} (${types[d.type]} | ${client.timestamp(d.date)}): ${d.roles.map(r => roleMention(r)).join(', ')}`
        );

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(datas.slice(0, 10).join('\n')).setFooter({
                    text: `${document.roleLogs.length} rol değişim kaydı bulundu.`
                })
            ],
            components: [client.getButton(page, totalPages)],
        });

        if (10 >= document.roleLogs.length) return;

        const filter = (i) => i.user.id === message.author.id && i.isButton();
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i) => {
            i.deferUpdate();

            if (i.customId === 'first') page = 1;
            if (i.customId === 'previous') page -= 1;
            if (i.customId === 'next') page += 1;
            if (i.customId === 'last') page = totalPages;

            question.edit({
                embeds: [
                    embed.setDescription(datas.slice(page === 1 ? 0 : page * 10 - 10, page * 10).join('\n')),
                ],
                components: [client.getButton(page, totalPages)],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.functions.timesUp()] });
        });
    },
};
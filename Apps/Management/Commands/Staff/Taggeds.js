const { EmbedBuilder } = require('discord.js')
const { StaffModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'taglılarım',
    Aliases: [],
    Description: 'Sunucudaki taglılarını listeler.',
    Usage: 'taglılarım',
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

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!member) return message.channel.send({ content: `Kullanıcı bulunamadı!` });
        if (!client.staff.check(member, ertu)) return message.channel.send({ content: 'Belirttiğin kullanıcı yetkili değil!' });

        const document = await StaffModel.findOne({ user: member.id });
        if (!document || !document.taggeds.length) return message.channel.send({ content: 'Belirttiğin kullanıcı veritabanında bulunamadı!' });

        const taggeds = await Promise.all(
            document.taggeds.map(async (t) => {
                const tagged = message.guild?.members.cache.get(t.user);
                return `${tagged ? tagged : '[@bulunamadı](https://ertu.live)'} ${tagged ? tagged?.tag() ? await client.getEmoji('check') : await client.getEmoji('mark') : await client.getEmoji('mark')} - ${client.timestamp(t.date)}`;
            })
        );

        let page = 1;
        const totalData = Math.ceil(document.taggeds.length / 10);

        const mainPage = new EmbedBuilder({
            description: [
                `${await client.getEmoji('arrow')} ${member} adlı yetkilinin taglı geçmişi aşağıda belirtilmiştir.`,
                ' ',
                taggeds.slice(0, 10).join('\n'),
            ]
        });

        const question = await message.channel.send({
            embeds: [mainPage],
            components: document.taggeds.length > 10 ? [client.getButton(page, totalData)] : [],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 60000 });

        collector.on('collect', async (i) => {
            i.deferUpdate();

            if (i.customId === 'first') page = 1;
            if (i.customId === 'previous') page -= 1;
            if (i.customId === 'next') page += 1;
            if (i.customId === 'last') page = totalData;

            const newData = taggeds.slice((page - 1) * 10, page * 10).join('\n');

            question.edit({
                embeds: [mainPage.setDescription(newData)],
                components: [client.getButton(page, totalData)],
            });
        });
    },
};
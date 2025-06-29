const { EmbedBuilder, inlineCode } = require('discord.js')
const { StaffModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'yetkililerim',
    Aliases: ['staffs'],
    Description: 'Sunucudaki yetkililerini listeler.',
    Usage: 'yetkililerim',
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
        if (!document || !document.staffs.length) return message.channel.send({ content: 'Belirttiğin kullanıcı veritabanında bulunamadı!' });

        const staffs = await Promise.all(
            document.staffs.map(async (s, i) => {
                const staff = message.guild.members?.cache.get(s.user);
                return `${inlineCode(` ${i + 1}. `)} ${staff ? staff : '[@bulunamadı](https://ertu.live)'} ${staff ? client.staff.check(staff, ertu) ? await client.getEmoji('check') : await client.getEmoji('mark') : await client.getEmoji('mark')} - ${client.timestamp(s.date)}`;
            })
        );

        let page = 1;
        const totalData = Math.ceil(document.staffs.length / 10);

        const mainPage = new EmbedBuilder({
            description: [
                `${await client.getEmoji('arrow')} ${member} adlı yetkilinin yetkili geçmişi aşağıda belirtilmiştir.`,
                ' ',
                staffs.slice(0, 10).join('\n'),
            ].join('\n'),
        });

        const question = await message.channel.send({
            embeds: [mainPage],
            components: document.staffs.length > 10 ? [client.getButton(page, totalData)] : [],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 60000 });

        collector.on('collect', async (i) => {
            i.deferUpdate();

            if (i.customId === 'first') page = 1;
            if (i.customId === 'previous') page -= 1;
            if (i.customId === 'next') page += 1;
            if (i.customId === 'last') page = totalData;

            const data = staffs.slice((page - 1) * 10, page * 10);
            mainPage.setDescription([
                `${await client.getEmoji('arrow')} ${member} adlı yetkilinin yetkili geçmişi aşağıda belirtilmiştir.`,
                ' ',
                data.join('\n'),
            ]);

            question.edit({
                embeds: [mainPage],
                components: [client.getButton(page, totalData)]
            });
        });
    },
};
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { StaffModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'oryantasyon',
    Aliases: ['or'],
    Description: 'Yetkilinin oryantasyon aldığını belirtir.',
    Usage: 'oryantasyon <Yetkili>',
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
        if (member.id === message.author.id) return message.channel.send({ content: 'Kendine işlem uygulayamazsın.' })

        const { currentRank } = client.staff.getRank(message.member, ertu);
        if (!currentRank) return message.channel.send({ content: `${await client.getEmoji('mark')} Belirttiğin kullanıcı yetkili değil!` });
        if (currentRank.type == 'sub') return message.channel.send({ content: `${await client.getEmoji('mark')} Belirttiğin kullanıcı orta/üst yetkili değil!` });

        const document = await StaffModel.findOne({ user: member.id })
        if (!document) return message.channel.send({ content: `${await client.getEmoji('mark')} Yetkili veriniz bulunamadı!` });
        if (document.hasOrientation) return message.channel.send({ content: `${await client.getEmoji('mark')} Zaten oryantasyon almış!` });

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'accept',
                    label: 'Kabul Ediyorum',
                    style: ButtonStyle.Success,
                }),

                new ButtonBuilder({
                    customId: 'decline',
                    label: 'Reddediyorum',
                    style: ButtonStyle.Danger,
                }),
            ]
        });

        const question = await message.channel.send({
            content: `${member}, ${message.author} yetkilisinin size oryantasyon verdiğini belirtmek için aşağıdaki butonlardan birini kullanabilirsiniz.`,
            components: [row]
        });

        const collector = question.createMessageComponentCollector({ filter: m => m.user.id === member.id, time: 60 * 1000 });

        collector.on('collect', async (i) => {
            i.deferUpdate();

            if (i.customId === 'accept') {
                question.edit({
                    components: [],
                    content: `${await client.getEmoji('check')} Başarıyla oryantasyon aldığınızı belirttiniz!`
                });

                await StaffModel.updateOne({ user: member.id }, { $set: { hasOrientation: true } });
                await client.staff.checkRank(client, message.member, ertu, { type: 'ORIENTATION', amount: 1 });
                return collector.stop('success');
            }

            if (i.customId === 'decline') {
                question.edit({
                    components: [],
                    content: `${await client.getEmoji('mark')} Ortantasyonu reddetiniz!`
                });

                return collector.stop();
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'success') return;
            question.edit({
                components: [client.functions.timesUp()],
                content: `${await client.getEmoji('mark')} Oryantasyonu reddettiniz!`
            }).then((m) => { setTimeout(() => m.delete().catch(() => { }), 5000); }).catch(() => { });
        });
    },
};      
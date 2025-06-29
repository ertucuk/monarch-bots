const { PermissionsBitField: { Flags }, bold, userMention, roleMention, ComponentType } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas');

const types = {
    'Join': 'Giriş',
    'Leave': 'Çıkış',
    'Move': 'Taşıma',
    'Disconnect': 'Bağlantı Kesme',
};

module.exports = {
    Name: 'voicelog',
    Aliases: ['voicelog', 'voice-log', 'vl', 'vlog', 'kanal-log', 'kanallog', 'kanalog', 'seslog', 'ses-log'],
    Description: 'Belirttiğiniz üyenin tüm ses log verilerini görüntülersiniz.',
    Usage: 'voicelog <@User/ID>',
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

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!member) return client.embed(message, 'Geçerli bir üye belirtmelisiniz.');

        const document = await UserModel.findOne({ id: member.id });
        if (!document || !document.voiceLogs.length) return client.embed(message, 'Belirtilen üyenin ses değişim kaydı bulunamadı.');

        let page = 1;
        const totalPages = Math.ceil(document.voiceLogs.length / 10);
        const datas = document.voiceLogs.reverse().map((d) => {
            const channel = message.guild.channels.cache.get(d.channel) || { name: 'deleted-channel' };
            return `${bold(types[d.type])} | ${client.timestamp(d.date)} | ${channel}`;
        });

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(datas.slice(0, 10).join('\n')).setFooter({
                    text: `${document.voiceLogs.length} ses log kaydı bulundu.`
                })
            ],
            components: totalPages > 1 ? [client.getButton(page, totalPages)] : [],
        });

        if (10 >= document.voiceLogs.length) return;

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
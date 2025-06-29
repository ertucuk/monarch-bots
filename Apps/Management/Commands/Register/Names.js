const { PermissionsBitField: { Flags }, EmbedBuilder, ComponentType, codeBlock, bold } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas/')

module.exports = {
    Name: 'isimler',
    Aliases: ['isimler'],
    Description: 'Belirlenen üyenin daha önceki isim ve yaşlarını gösterir.',
    Usage: 'isimler <@User/ID>',
    Category: 'Register',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed,) => {

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!member) {
            client.embed(message, `Kullanıcı bulunamadı!`);
            return;
        }

        const document = await UserModel.findOne({ id: member.id });
        if (!document || !document.nameLogs.length) {
            client.embed(message, 'Kullanıcının verisi bulunmuyor.');
            return;
        };

        let page = 1;
        const totalData = Math.ceil(document.nameLogs.length / 10);
        const mappedData = document.nameLogs.reverse().map((x) => `[${client.timestamp(x.date)}] [${x.name}](https://discord.com/channels/${message.guild.id}/${x.channel}/${x.message}) - ${bold(x.type)}`);

        const question = await message.channel.send({
            embeds: [embed.setDescription(`Toplam ${bold(document.nameLogs.length)} isim geçmişi bulunmakta.\n\n` + mappedData.slice(0, 10).join('\n'))],
            components: document.nameLogs.length > 10 ? [client.getButton(page, totalData)] : [],
        });

        if (10 > document.nameLogs.length) return;

        const filter = (i) => i.user.id === message.author.id && i.isButton();
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', (i) => {
            i.deferUpdate();

            if (i.customId === 'first') page = 1;
            if (i.customId === 'previous') page -= 1;
            if (i.customId === 'next') page += 1;
            if (i.customId === 'last') page = totalData;

            question.edit({
                embeds: [embed.setDescription(`Toplam ${bold(document.nameLogs.length)} isim geçmişi bulunmakta.\n\n` + mappedData.slice(page === 1 ? 0 : page * 10 - 10, page * 10).join('\n'))],
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
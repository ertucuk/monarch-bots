const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Interaction } = require('discord.js')
const { UserModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'taglı',
    Aliases: [],
    Description: 'Sunucu için log kanalları oluşturur.',
    Usage: 'taglı',
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

        if (client.functions.checkUser(message, member)) return;
        if (!member.user.displayName.includes(ertu.settings.tag)) return message.channel.send({ content: `${await client.getEmoji('mark')} Belirttiğin kullanıcı tagımızı almadığı için bu işlem gerçekleştirilemez!` });
        const userDocument = await UserModel.findOne({ id: member.id });
        if (!userDocument) return message.channel.send({ content: 'Belirttiğin kullanıcı veritabanında bulunamadı!' });
        if (userDocument.isTagged) return message.channel.send({ content: 'Belirttiğin kullanıcı zaten önceden taglı olarak belirlenmiş!' });

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'accept',
                    label: 'Kabul Ediyorum',
                    style: ButtonStyle.Secondary,
                    emoji: { id: await client.getEmojiID('check') },
                }),
                new ButtonBuilder({
                    custom_id: 'deaccept',
                    label: 'Reddediyorum',
                    style: ButtonStyle.Secondary,
                    emoji: { id: await client.getEmojiID('mark') },
                }),
            ],
        });

        const question = await message.channel.send({
            content: `${member}, ${message.author} adlı yetkili seni taglı olarak belirtmek istiyor. Kabul ediyor musun?`,
            components: [row],
        });

        const filter = (i) => i.user.id === member.id;
        const collector = question.createMessageComponentCollector({ filter, time: 60000, componentType: ComponentType.Button });

        collector.on('collect', async (i) => {
            if (i.customId === 'accept') {
                await question.edit({ content: `${await client.getEmoji('check')} ${member} kullanıcısı taglı olarak işaretlendi!`, components: [] });
                await UserModel.updateOne({ id: member.id }, { $set: { isTagged: true } }, { upsert: true });

                if (!client.staff.check(message.member, ertu)) return;
                await client.staff.checkRank(client, message.member, ertu, { type: 'taggedPoints', amount: 1, point: 50, user: member.id });
            } else if (i.customId === 'deaccept') {
                await question.edit({ content: `${await client.getEmoji('mark')} ${member} kullanıcısı taglı isteğini reddetti!`, components: [] });
            };
        });
    },
};
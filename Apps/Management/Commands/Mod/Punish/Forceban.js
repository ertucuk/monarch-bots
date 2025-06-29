const { EmbedBuilder, bold, inlineCode } = require('discord.js');
const { PunitiveModel } = require('../../../../../Global/Settings/Schemas/')

module.exports = {
    Name: 'forceban',
    Aliases: ['açılmazban', 'açılmaz-ban', 'forceban', 'force-ban', 'infaz'],
    Description: 'Belirttiğiniz kullanıcının banını açılmaz olarak işaretlersiniz.',
    Usage: 'forceban <@User/ID>',
    Category: 'Root',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {

        if (!args[0]) return client.embed(message, 'Üye belirtmelisiniz.');
        const member = await client.getMember(args[0]);
        const reason = args.splice(1).join(' ') || 'Sebep Belirtilmedi.'
        const newID = (await PunitiveModel.countDocuments()) + 1;

        await PunitiveModel.create({
            id: newID,
            type: 'ForceBan',
            user: member.id,
            staff: message.author.id,
            reason: reason,
            finishedTime: undefined,
            createdTime: Date.now(),
            active: true,
            visible: true,
        });

        await message.guild.members.ban(member.id, { reason: `Yetkili: ${message.author.username} | Sebep: ${reason} | Ceza Numarası: #${newID}` });
        message.channel.send({
            flags: [4096],
            embeds: [new EmbedBuilder({
                color: client.getColor('random'),
                description: `${member} adlı kullanıcı "${bold(reason)}" sebebiyle kalıcı yasaklandı. (Ceza Numarası: ${inlineCode(`#${newID}`)})`
            })],
        });
    },
};

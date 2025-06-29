const { inlineCode } = require('discord.js');
const { PunitiveModel } = require('../../../../../Global/Settings/Schemas/')

module.exports = {
    Name: 'unforceban',
    Aliases: ['unforce-ban'],
    Description: 'Banını kaldıralamaz olarak işaretlediğiniz kullanıcının banını kaldırırsınız.',
    Usage: 'unforceban <@User/ID>',
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

        const member = await client.getMember(args[0]);
        if (member.id === message.author.id) {
            client.embed(message, 'Kendi cezanızı kaldıramazsınız.');
            return;
        }

        const reason = args.slice(1).join(' ') || 'Belirtilmedi.';

        const document = await PunitiveModel.findOne({ user: member.id, active: true, type: 'ForceBan' });
        if (!document) {
            client.embed(message, 'Kullanıcının cezası yok.');
            return;
        }

        message.guild.members.unban(member.id)
        message.channel.send({
            embeds: [
                embed.setDescription(`${member} ${inlineCode(member.id)} kullanıcısının başarıyla cezası kaldırıldı.`),
            ],
        });

        await PunitiveModel.updateMany(
            {
                active: true,
                user: member.id,
                type: 'ForceBan',
            },
            { $set: { active: false, remover: message.author.id, removedTime: Date.now(), removeReason: reason } },
        );
    },
};
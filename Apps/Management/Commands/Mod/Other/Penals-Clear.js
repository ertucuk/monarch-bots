const { PermissionsBitField: { Flags }, codeBlock } = require('discord.js');
const { PunitiveModel } = require('../../../../../Global/Settings/Schemas')

module.exports = {
    Name: 'siciltemizle',
    Aliases: ['sicil-temizle'],
    Description: 'Kullanıcının bütün sicil verilerini sıfırlar.',
    Usage: 'sicil-temizle <@User/ID>',
    Category: 'Moderation',
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
        if (!member) {
            client.embed(message, 'Kullanıcı bulunamadı!')
            return;
        }

        await PunitiveModel.updateMany({ user: member.id }, { visible: false });
        message.channel.send({
            embeds: [
                embed.setDescription(`${member} adlı kullanıcının bütün sicil verileri başarıyla sıfırlandı.`)
            ],
        });
    },
};
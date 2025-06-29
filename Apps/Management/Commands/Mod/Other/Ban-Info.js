const { PermissionsBitField: { Flags }, codeBlock } = require('discord.js');
const { PunitiveModel } = require('../../../../../Global/Settings/Schemas/')

module.exports = {
    Name: 'ban-info',
    Aliases: ['baninfo', 'banbilgi', 'bilgiban', 'infoban', 'info-ban', 'ban-bilgi', 'bilgi-ban'],
    Description: 'Sunucuda yasaklanan bir kullanıcının yasağını kaldırmadan bilgisini gösterir.',
    Usage: 'ban-bilgi <@User/ID>',
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

        const member = await client.getMember(args[0]);
        if (!member) {
            client.embed(message, 'Kullanıcı bulunamadı!')
            return;
        }
        
        const info = {
            staff: '',
            reason: '',
        };

        const ban = await message.guild.bans.fetch(member.id).catch(() => null);
        if (!ban) {
            client.embed(message, 'Kullanıcı yasaklı değil.')
            return;
        }

        const penal = await PunitiveModel.findOne({ user: member.id, type: 'Ban', visible: true });
        if (penal) {
            info.staff = penal.staff;
            info.reason = penal.reason;
        } else {
            info.staff = 'Bilinmiyor.';
            info.reason = ban.reason || 'Belirtilmemiş.';
        }

        message.channel.send({
            content: [
                codeBlock('fix', `Kullanıcı: ${ban.user.username} (${ban.user.id})`),
                codeBlock('fix', `Yetkili: (${info.staff !== 'Bilinmiyor.' ? (await client.getMember(info.staff))?.username : 'Bilinmiyor.'})`),
            ].join('\n'),
        });
    },
};
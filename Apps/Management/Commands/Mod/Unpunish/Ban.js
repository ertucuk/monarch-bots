const { EmbedBuilder, inlineCode, bold } = require('discord.js');
const { PunitiveModel } = require('../../../../../Global/Settings/Schemas/')

module.exports = {
    Name: 'unyargı',
    Aliases: ['yargı-kaldır', 'yargıkaldir', 'yargikaldir', 'unyargı', 'yargıkaldır'],
    Description: 'Yasaklı kullanıcının banını kaldırırsın.',
    Usage: 'yargıkaldır <@User/ID>',
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
        if (member.id === message.author.id) {
            client.embed(message, 'Kendi cezanızı kaldıramazsınız.');
            return;
        }

        const reason = args.slice(1).join(' ')
        if (!reason) {
            client.embed(message, 'Geçerli bir sebep belirtmelisiniz.')
            return;
        }

        const document = await PunitiveModel.findOne({ user: member.id, active: true, type: 'Ban' });
        const bans = await message.guild.bans.fetch();
        if (bans.size === 0) {
            client.embed(message, 'Sunucuda yasaklı üye bulunmuyor.');
            return;
        }

        const bannedMember = await client.getBan(message.guild, member)
        if (!bannedMember) {
            client.embed(message, 'Bu üye banlı değil!');
            return;
        }

        if (document) await PunitiveModel.updateOne({ user: member.id, type: 'Ban', active: true }, {
            $set: {
                active: false,
                remover: message.author.id,
                removedTime: Date.now(),
                removeReason: reason,
            }
        });

        await message.guild.members.unban(member.id).catch(() => null);
        client.embed(message, `${member} üyesinin ${inlineCode('ban')} cezası ${bold(reason)} sebebiyle kaldırıldı.`);
    },
};
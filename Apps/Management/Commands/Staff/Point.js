const { bold, EmbedBuilder, inlineCode, underline } = require('discord.js')
const { StaffModel, UserModel, PunitiveModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'puan',
    Aliases: ['p'],
    Description: 'Sunucuda ki yetkililerin puanlarını gösterir.',
    Usage: 'puan <@User/ID>',  
    Category: 'Staff',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!member) return message.channel.send({ content: `Kullanıcı bulunamadı!` });

        if (message.author.id !== member.id && client.functions.checkUser(message, member)) return;

        const { currentRank, newRank } = client.staff.getRank(member, ertu);
        if (!currentRank) {
            message.channel.send({ content: 'Belirttiğin kullanıcı yetkili değil!' });
            return;
        }

        if (currentRank.type !== 'sub') {
            message.channel.send({ content: 'Belirttiğin kullanıcı bir alt yetkili değil!' });
            return;
        }

        const document = await StaffModel.findOne({ user: member.id });
        if (!document) {
            message.channel.send({ content: 'Belirttiğin kullanıcı veritabanında bulunamadı!' });
            return;
        }

        const staffRole = message.guild?.roles.cache.get(currentRank.role);
        const newStaffRole = newRank ? message.guild?.roles.cache.get(newRank.role) : undefined;

        const embed = new EmbedBuilder({
            description: [
                `${await client.getEmoji('arrow')} ${member} üyesinin puan bilgileri ve yüzdelik bilgileri;`,
                ' ',
                `${await client.getEmoji('point')} ${inlineCode(` Toplam         :`)} ${underline(document.totalPoints)}/${bold(currentRank.point)} (${bold('%' + calculatePercentage(document.totalPoints, currentRank.point))})`,
                `${await client.getEmoji('point')} ${inlineCode(` Şuanki Rol     :`)} ${staffRole}`,
                `${await client.getEmoji('point')} ${inlineCode(` Başlama Tarihi :`)} ${document.roleStartAt ? client.timestamp(document.roleStartAt) : bold('Rolü bulunmuyor.')}`,
                ' ',
                `${await client.getEmoji('point')} ${inlineCode(` Afk Kanalları      :`)} ${document.afkPoints} (%${calculatePercentage(document.afkPoints, document.totalPoints)})`,
                `${await client.getEmoji('point')} ${inlineCode(` Metin Kanalları    :`)} ${document.messagePoints} (%${calculatePercentage(document.messagePoints, document.totalPoints)})`,
                `${await client.getEmoji('point')} ${inlineCode(` Public Kanalları   :`)} ${document.publicPoints} (%${calculatePercentage(document.publicPoints, document.totalPoints)})`,
                `${await client.getEmoji('point')} ${inlineCode(` Stream Kanalları   :`)} ${document.streamerPoints} (%${calculatePercentage(document.streamerPoints, document.totalPoints)})`,
                `${await client.getEmoji('point')} ${inlineCode(` Etkinlik Kanalları :`)} ${document.activityPoints} (%${calculatePercentage(document.activityPoints, document.totalPoints)})`,
                ' ',
                `${await client.getEmoji('point')} ${inlineCode(` Bonus         :`)} ${document.bonusPoints} (%${calculatePercentage(document.bonusPoints, document.totalPoints)})`,
                `${await client.getEmoji('point')} ${inlineCode(` Davet Yapma   :`)} ${document.invitePoints} (%${calculatePercentage(document.invitePoints, document.totalPoints)})`,
                `${await client.getEmoji('point')} ${inlineCode(` Kayıt Yapma   :`)} ${document.registerPoints} (%${calculatePercentage(document.registerPoints, document.totalPoints)})`,
                `${await client.getEmoji('point')} ${inlineCode(` Taglı Çekme   :`)} ${document.taggedPoints} (%${calculatePercentage(document.taggedPoints, document.totalPoints)})`,
                `${await client.getEmoji('point')} ${inlineCode(` Yetkili Çekme :`)} ${document.staffPoints} (%${calculatePercentage(document.staffPoints, document.totalPoints)})`, 
                ' ',
                `${await client.functions.createBar(client, document.totalPoints, currentRank.point)} (${inlineCode(` ${document.totalPoints} / ${currentRank.point} `)})`,
                newStaffRole ? `${newStaffRole} Rolüne ${inlineCode(` ${currentRank.point - document.totalPoints} `).toString()} Puan kaldı.` : undefined,
            ].filter(Boolean).join('\n'),
        })

        message.channel.send({ embeds: [embed] });
    },
};

function calculatePercentage(value, totalValue) {
    return value ? Math.floor((100 * value) / totalValue) : 0
}   
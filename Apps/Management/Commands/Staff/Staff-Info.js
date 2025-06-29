const { bold, EmbedBuilder, inlineCode, roleMention } = require('discord.js')
const { StaffModel, UserModel, PunitiveModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'ybilgi',
    Aliases: ['yb', 'ystat', 'ys'],
    Description: 'Sunucudaki yetkililerin bilgilerini listeler.',
    Usage: 'ystat <@User/ID>',
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

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!member) return message.channel.send({ content: `Kullanıcı bulunamadı!` });

        const loading = await message.channel.send(`Veriler alınıyor...`);

        const punitiveDocument = await PunitiveModel.find({ staff: member.id });
        const staffDocument = await StaffModel.findOne({ user: member.id });

        if (!staffDocument) return loading.edit(`${await client.getEmoji('mark')} Belirttiğin kullanıcının hiç verisi yok!`);
        const { currentRank, currentIndex } = client.staff.getRank(member, ertu);

        const firstStaffData = staffDocument.oldRanks[0];
        const firstStaffStarter = message.guild?.members.cache.get(firstStaffData?.staff);
        const lastStaffData = staffDocument.oldRanks[staffDocument.oldRanks.length - 1];
        const lastStaffStarter = message.guild?.members.cache.get(lastStaffData?.staff);

        const oldRanks = await Promise.all(
            staffDocument.oldRanks.reverse().slice(0, 10).map(async (r) => {
                const staff = message.guild?.members.cache.get(r.staff);
                const role = r.roles.find((role) => message.guild?.roles.cache.has(role));

                return `${await client.getEmoji('point')} [${client.timestamp(r.date)}] ${r.up ? await client.getEmoji('check') : await client.getEmoji('mark')} : ${staff ? staff : '[@bulunamadı](https://ertu.live)'} ${r.roles ? (role ? roleMention(role) : '[@bulunamadı](https://ertu.live)') : '[@bulunamadı](https://ertu.live)'} => ${r.reason}`;
            })
        );

        const excuses = await Promise.all(
            (staffDocument?.excuses || []).map(async (e) => {
                const staff = message.guild?.members.cache.get(e.staff);

                return `${await client.getEmoji('point')} [${client.timestamp(e.startAt)} - ${client.timestamp(e.endAt)}] ${staff ? staff : '[@bulunamadı](https://ertu.live)'} : ${e.reason}`;
            })
        );

        const ilisuion = new EmbedBuilder({
            author: {
                name: member.user.username,
                icon_url: member.user.displayAvatarURL(),
            },

            description: [
                `${await client.getEmoji('arrow')} ${member} adli kullanıcının yetkili bilgileri;`,
                ' ',
                `${await client.getEmoji('arrow')} ${bold('Kullanıcı Bilgileri')}`,
                `${await client.getEmoji('point')} Kullanıcı: ${member} (${inlineCode(member.id)})`,
                `${await client.getEmoji('point')} Yetkisi: ${currentRank ? `${roleMention(currentRank.role)} (${currentIndex + 1}. sırada)` : 'Yetkisi bulunamadı.'}`,
                `${await client.getEmoji('point')} Oluşturduğu Ceza Sayısı: ${inlineCode(` ${punitiveDocument.length} adet`)}`,
                ' ',
                `${await client.getEmoji('arrow')} ${bold('Mazaretler')}`,
                excuses.length ? excuses.join('\n') : `${await client.getEmoji('point')} Mazeretleri bulunamadı.`,
                ' ',
                `${await client.getEmoji('arrow')} ${bold('İlk Yetki Durumu')}`,
                `${await client.getEmoji('point')} Başlangıç Tarihi: ${client.timestamp(firstStaffData?.date)}`,
                `${await client.getEmoji('point')} Yetkiyi Veren: ${firstStaffStarter ? firstStaffStarter : '[@bulunamadı](https://ertu.live)'}`,
                `${await client.getEmoji('point')} Rolleri: ${firstStaffData.roles.filter((r) => message.guild?.roles.cache.has(r)).map((r) => roleMention(r)).listArray()}`,
                ' ',
                `${await client.getEmoji('arrow')} ${bold('Son Yetki Durumu')}`,
                `${await client.getEmoji('point')} Bitiş Tarihi: ${client.timestamp(lastStaffData.date)}`,
                `${await client.getEmoji('point')} Yetkiyi Veren: ${lastStaffStarter ? lastStaffStarter : '[@bulunamadı](https://ertu.live)'}`,
                `${await client.getEmoji('point')} Rolleri: ${lastStaffData.roles.filter((r) => message.guild?.roles.cache.has(r)).map((r) => roleMention(r)).listArray()}`,
                ' ',
                `${await client.getEmoji('arrow')} ${bold('Yetki Engeli')}`,
                `${await client.getEmoji('point')} Yetki Engeli: ${staffDocument.authBlock ? await client.getEmoji('check') : await client.getEmoji('mark')}`,
                ' ',
                `${await client.getEmoji('arrow')} ${bold('Yetki Değişiklikleri')}`,
                oldRanks.join('\n')
            ].join('\n'),
        });

        loading.edit({ content: null, embeds: [ilisuion] });
    },
};
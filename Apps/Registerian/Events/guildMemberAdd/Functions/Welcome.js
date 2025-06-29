const { UserModel } = require('../../../../../Global/Settings/Schemas');
const { inlineCode, ChannelType, bold, roleMention } = require('discord.js');

module.exports = async function Welcome(client, member, ertu, channel) {
    const chatChannel = member.guild.channels.cache.get(ertu.settings.chatChannel);

    const document = await UserModel.findOne({ id: member.id });

    if (ertu.systems.autoRegister && document && document.gender && document.name) {
        if (document && document.gender == 'Man') {
            member.setNickname(`${member.tag()} ${document.name}`).catch(() => null);
            member.setRoles(ertu.settings.manRoles).catch(() => null);
            document.nameLogs.push(
                {
                    gender: 'ERKEK',
                    type: 'Erkek',
                    date: Date.now(),
                    type: 'Otomatik Kayıt',
                    name: document.name,
                    staff: client?.user?.id
                }
            );

            await document.save();
        }

        if (document && document.gender == 'Girl') {
            member.setNickname(`${member.tag()} ${document.name}`).catch(() => null);
            member.setRoles(ertu.settings.womanRoles).catch(() => null);
            document.nameLogs.push(
                {
                    gender: 'KADIN',
                    type: 'Kadın',
                    date: Date.now(),
                    type: 'Otomatik Kayıt',
                    name: document.name,
                    staff: client?.user?.id
                }
            );

            await document.save();
        }

        if (member.user.displayName.includes(ertu.settings.tag)) member.roles.add(ertu.settings.familyRole);

        if (chatChannel) chatChannel.send({
            content: `Tekrar aramıza hoş geldin ${member}`
        });

        if (channel) channel.send({
            content: `${await client.getEmoji('check')} ${member} (${inlineCode(`${member.user.username} - ${member.user.id}`)}) adlı üye önceden kayıtlı olduğu için kayıdı otomatik yapıldı.`
        });
        return;
    }

    member.setRoles(ertu.settings.unregisterRoles).catch(() => null);
    member.setNickname(`${member.tag()} ${ertu.settings.name}`).catch(() => null);

    const registerParent = member.guild.channels.cache.get(ertu.settings.registerParent);
    const randomChannel = member.guild.channels.cache.filter(c => c.isVoiceBased() && c.parentId === registerParent?.id).random();

    if (channel) channel.send({
        content: [
            `Merhabalar ${member}, aramıza hoşgeldin. Seninle beraber sunucumuz ${bold(member.guild.memberCount)} üye sayısına ulaştı. 🎉`,

            `Hesabın ${client.timestamp(member.user.createdTimestamp, 'f')} tarihinde ${client.timestamp(member.user.createdTimestamp)} oluşturulmuş!`,

            `Sunucuya erişebilmek için ${randomChannel} odalarında kayıt olup ismini ve yaşını belirtmen gerekmektedir!`,

            `${member.guild.channels.cache.find(c => c.name === 'rules' || c.name === 'kurallar')} kanalından sunucu kurallarımızı okumayı ihmal etme!`,
        ].filter(Boolean).join('\n\n'),
    });
}
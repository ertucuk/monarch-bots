const { bold, codeBlock } = require('discord.js')
const { StaffModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'yetkiçek',
    Aliases: ['staffremove', 'yçek', 'yç'],
    Description: 'Belirtilen kullanıcının rollerini çeker.',
    Usage: 'yçek <@User/ID> <sebep>',
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
        if (message.author.id === member.id) return message.channel.send({ content: 'Kendi yetkilerini çekemezsin!' });
        if (member.user.bot) return message.channel.send({ content: 'Botlar için bu komutu kullanamazsınız!' });

        if (!client.staff.check(member, ertu)) return;

        const reason = args.slice(1).join(' ')
        if (!reason) return message.channel.send({ content: 'Sebep belirtmelisin!' });

        const removedRoles = member.removeStaffRoles();
        if (!removedRoles) return message.channel.send({ content: 'Kullanıcının yetkileri zaten alınmış!' });

        const roleName = removedRoles.map((role) => message.guild.roles.cache.get(role).name).join(', ');

        message.channel.send({
            embeds: [
                embed.setDescription(`${member} adlı kullanıcının ${bold(roleName)} yetkileri alındı.`),
            ]
        });

        await StaffModel.updateOne(
            { user: member.id },
            {
                $push: {
                    oldRanks: {
                        staff: message.author.id,
                        roles: removedRoles,
                        date: new Date(),
                        reason: `Yetkileri Alındı: ${reason}`
                    },
                },
            }
        ).catch(() => { })

        member.send({
            embeds: [
                embed.setDescription(`${bold(message.guild.name)} sunucusunda yetkilerin alındı.\n**Sebep:** ${bold(reason)}`)
            ]
        }).catch(() => { });

        const logChannel = await client.getChannel(client.data.logs.staffremove, message);
        if (logChannel) logChannel.send({
            flags: [4096],
            embeds: [
                embed.setDescription(
                    [
                        `${member} adlı kullanıcının ${message.author} tarafından yetkileri alındı.`,
                        '',
                        `Kullanıcı: ${member} (${member.id})`,
                        `Yetki Alan: ${message.author} (${message.author.id})`,
                        `Sebep: ${reason}`,
                        `Yetkileri: ${removedRoles.listArray()}`,
                        `Tarih: ${client.timestamp(Date.now())}`,
                    ].join('\n')),
            ]
        });
    },
};
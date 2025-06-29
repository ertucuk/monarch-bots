const { PermissionsBitField, EmbedBuilder, codeBlock } = require('discord.js');
const { UserModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function specialHandler(client, message, prefix, ertu) {
    const data = ertu?.specialCmds || [];
    let cmd, args;

    if (prefix) {
        args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args[0].toLowerCase();
        cmd = data.find((cmd) => cmd.permName === command);
        args.shift();

        if (!cmd && [`<@${client.user.id}>`, `<@!${client.user.id}>`].includes(prefix)) {
            cmd = data.find((cmd) => cmd.permName === command);
            args.shift();
        }

        if (!cmd) return;

        if (
            !cmd.permRoles.some(id => message.member.roles.cache.has(id) || message.author.id === id)
            &&
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
            &&
            !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)
            &&
            !ertu.settings.founders.some(x => message.member.roles.cache.has(x))
        ) {
            message.reply({ content: 'Bu komutu kullanmak için yetkiniz bulunmamakta.' });
            return;
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            message.reply({ content: 'Geçerli bir üye belirtmelisiniz.' });
            return;
        }

        const hasRole = cmd.permRoles2 ? cmd.permRoles2.some((role) => member.roles.cache.has(role)) : member.roles.cache.has(cmd.permRoles2);

        await UserModel.updateOne({ id: member.id }, {
            $push: {
                roleLogs: {
                    type: hasRole ? 'remove' : 'add',
                    date: Date.now(),
                    staff: message.author.id,
                    roles: cmd.permRoles2
                }
            }
        });

        const log = await client.getChannel(hasRole ? client.data.logs.roleRemove : client.data.logs.roleAdd, message);
        if (log) {
            log.send({
                flags: [4096],
                embeds: [
                    new EmbedBuilder({  
                        color: hasRole ? client.getColor('red') : client.getColor('green'),
                        title: `Rol ${hasRole ? 'Çıkarıldı' : 'Eklendi'}! (Özel Komut)`,
                        thumbnail: { url: member.displayAvatarURL({ size: 2048, extension: 'png' }) },
                        description: [
                            `→ Kullanıcı: ${member.user} (${member.id})`,
                            `→ Yetkili: ${message.author} (${message.author.id})`,
                            `→ Rol: ${cmd.permRoles2.map((role) => `${message.guild.roles.cache.get(role)}`).join(', ')}`,
                            `→ Tarih: ${client.timestamp(Date.now())}`
                        ].join('\n')
                    })
                ]
            });
        }

        if (hasRole) {
            message.react(await client.getEmoji('check'));
            await member.roles.remove(cmd.permRoles2).catch(() => { });

            const embed = new EmbedBuilder({
                color: client.getColor('random'),
                author: { name: message.author.username, iconURL: message.author.avatarURL({ dynamic: true }) },
                description: `${await client.getEmoji('check')} ${member} kullanıcısından ${cmd.permRoles2.map((role) => `<@&${role}>`).join(', ')} ${cmd.permRoles2.length > 1 ? 'rolleri' : 'rolü'} başarıyla alındı.`
            })

            message.reply({ embeds: [embed] });
        } else {
            message.react(await client.getEmoji('check'));
            await member.roles.add(cmd.permRoles2).catch(() => { });

            const embed = new EmbedBuilder({
                color: client.getColor('random'),
                author: { name: message.author.username, iconURL: message.author.avatarURL({ dynamic: true }) },
                description: `${await client.getEmoji('check')} ${member} kullanıcısına ${cmd.permRoles2.map((role) => `<@&${role}>`).join(', ')} ${cmd.permRoles2.length > 1 ? 'rolleri' : 'rolü'} başarıyla verildi.`
            })

            message.reply({ embeds: [embed] });
        }
    }
} 
const { PermissionsBitField: { Flags }, EmbedBuilder, inlineCode, roleMention, codeBlock } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas/')
const ms = require('ms');

module.exports = {
    Name: 'kayıtsız',
    Aliases: ['kayitsiz', 'ks', 'unregister', 'unregistered', 'kayitsizyap'],
    Description: 'Belirlenen üyeyi kayıtsıza atar.',
    Usage: 'kayıtsız <@User/ID>',
    Category: 'Register',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {
        if (!(ertu.settings.unregisterRoles || []).length) {
            client.embed(message, 'Sunucuda kayıtsız rolü ayarlanmamış.');
            return;
        };

        const limit = client.functions.checkLimit(message, message.author.id, 'Unregister', ertu.settings.unregisteredLimitCount || 5, ms('5m'));
        if (limit.hasLimit) {
            client.embed(message, `Bu komutu kullanabilmek için ${limit.time} beklemelisin.`);
            return;
        };

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        if (!member) {
            client.embed(message, `Kullanıcı bulunamadı!`);
            return;
        }

        if (client.functions.checkUser(message, member)) return;

        const document = await UserModel.findOne({ id: member.id });
        if (document && document.nameLogs.length) {
            document.nameLogs.push(
                {
                    staff: message.author.id,
                    type: 'Kayıtsıza Atılma',
                    date: Date.now(),
                    name: document.name || member.displayName,
                    channel: message.channel.id,
                    message: message.id,
                }
            )
            document.gender = 'Unregister'
            await document.save();
        };

        member.setRoles(ertu?.settings?.unregisterRoles)
        member.setNickname(`${member.tag()} ${ertu.settings.name}`);

        message.react(await client.getEmoji('check'));
        message.reply({
            embeds: [
                embed.setDescription(
                    `${member} (${inlineCode(member.id)}) kullanıcısına ${ertu?.settings?.unregisterRoles.map(r => roleMention(r)).listArray()} rolleri verildi!`,
                ),
            ],
        });

        const registerLog = await client.getChannel(client.data.logs.register, message);
        if (registerLog) registerLog.send({
            flags: [4096],
            embeds: [
                new EmbedBuilder({
                    color: client.getColor('random'),
                    author: {
                        name: member.user.username,
                        icon_url: member.user.displayAvatarURL({ extension: 'png', size: 4096 }),
                    },

                    title: 'Kayıtsıza Atılma',
                    description: [
                        `${member} (${inlineCode(member.id)}) kullanıcısı kayıtsıza atıldı.`,
                        '',
                        `→ Kullanıcı: ${member.user.username}`,
                        `→ Yetkili: ${message.author.username}`,
                        `→ Tarih: ${client.functions.date(Date.now())}`,
                    ].join('\n'),
                })
            ]
        });
    },
};
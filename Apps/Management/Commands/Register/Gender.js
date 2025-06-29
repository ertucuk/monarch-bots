const { PermissionsBitField: { Flags }, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, codeBlock, bold, inlineCode } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas/')

module.exports = {
    Name: 'cinsiyet',
    Aliases: ['cinsiyet'],
    Description: 'Belirtilen üye sunucuda kayıtsız bir üye ise kayıt etmek için kullanılır.',
    Usage: 'cinsiyet <@User/ID>',
    Category: 'Register',
    Cooldown: 0,


    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        if (!member) {
            client.embed(message, `Kullanıcı bulunamadı!`);
            return;
        }

        if (
            (!ertu.settings.manRoles || !ertu.settings.manRoles.length || !ertu.settings.manRoles.some((r) => message.guild?.roles.cache.has(r))) &&
            (!ertu.settings.womanRoles || !ertu.settings.womanRoles.length || !ertu.settings.womanRoles.some((r) => message.guild?.roles.cache.has(r)))
        ) {
            client.embed(message, 'Sunucu ayarlarında erkek ve kadın rolleri belirtilmemiş.');
            return;
        };

        if (client.functions.checkUser(message, member)) return;

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'man',
                    label: 'Erkek',
                    style: ButtonStyle.Secondary,
                    disabled: ertu.settings.manRoles.some(x => member.roles.cache.has(x))
                }),
                new ButtonBuilder({
                    custom_id: 'woman',
                    label: 'Kadın',
                    style: ButtonStyle.Secondary,
                    disabled: ertu.settings.womanRoles.some(x => member.roles.cache.has(x))
                }),
            ],
        });

        const embed = new EmbedBuilder({
            author: { name: member.user.username, icon_url: member.user.displayAvatarURL({ dynamic: true }) },
            description: `Üyenin cinsiyetini değiştirmek için aşağıdaki butonları kullanabilirsiniz. Yeniden ses teyidi almadan önce, lütfen üyenin cinsiyetini değiştirmek istediğinizden emin olun, çünkü ses teyiti alınırken cinsiyet bilgisi güncellenecektir.`
        })

        const question = await message.channel.send({
            embeds: [embed],
            components: [row],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        const document = await UserModel.findOne({ id: member.id })
        const name = document.name || member.displayName ? member.displayName : member.user.username;

        collector.on('collect', async (i) => {
            i.deferUpdate();
            const gender = i.customId === 'man' ? 'Erkek' : 'Kadın';

            question.edit({
                embeds: [
                    embed.setDescription(`${member} adlı üyenin cinsiyeti ${bold(gender)} olarak değiştirildi.`)
                ],
                components: [],
            });

            await member.roles.remove(i.customId === 'man' ? ertu.settings.womanRoles : ertu.settings.manRoles).catch(err => { });
            await member.roles.add(i.customId === 'man' ? ertu.settings.manRoles : ertu.settings.womanRoles).catch(err => { });

            await UserModel.updateOne({ id: member.id },
                {
                    $set: {
                        gender: i.customId === 'man' ? 'Man' : 'Girl',
                    },
                    $push: {
                        nameLogs: {
                            type: 'Cinsiyet Değiştirme',
                            name: name,
                            date: Date.now(),
                            staff: message.author.id,
                        },
                    },
                },
                { upsert: true }
            );

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

                        title: gender === 'Cinsiyet Değiştirme',
                        description: codeBlock('yaml', [
                            `→ Kullanıcı: ${member.user.username}`,
                            `→ Yetkili: ${message.author.username}`,
                            `→ Tarih: ${client.functions.date(Date.now())}`,
                        ].join('\n')),
                    })
                ]
            });
        });
    },
};
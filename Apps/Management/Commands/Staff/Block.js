const { bold, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { StaffModel } = require('../../../../Global/Settings/Schemas');

module.exports = {
    Name: 'yetkiengel',
    Aliases: ['yetki-engel'],
    Description: 'Belirtilen kullanıcıya yetki engeli verir.',
    Usage: 'yetkiengel <@User/ID> <sebep>',
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

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) return message.channel.send({ content: `Kullanıcı bulunamadı!` });
        if (message.author.id === member.id) return message.channel.send({ content: 'Kendi yetkilerini çekemezsin!' });
        if (member.user.bot) return message.channel.send({ content: 'Botlar için bu komutu kullanamazsınız!' });
        if (client.functions.checkUser(message, member)) return;

        const reason = args.slice(1).join(' ')
        if (!reason) return message.channel.send({ content: 'Sebep belirtmelisin!' });

        const document = await StaffModel.findOne({ user: member.id })
        if (!document) return message.channel.send({ content: 'Belirttiğin kullanıcının yetkili verisi bulunamadı!' });

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'block',
                    label: 'Yetki Engeli Ekle',
                    style: ButtonStyle.Secondary,
                    disabled: !document.authBlock ? false : true,
                }),
                new ButtonBuilder({
                    custom_id: 'unblock',
                    label: 'Yetki Engeli Kaldır',
                    style: ButtonStyle.Secondary,
                    disabled: document.authBlock ? false : true,
                }),
            ],
        });

        const embed = new EmbedBuilder({
            color: client.getColor('random'),
            author: { name: message.guild.name, icon: message.guild.iconURL() },
            description: [
                `Belirtilen kullanıcıya hangi işlemi yapmak istersiniz?`,
                '',
                `${bold('Kullanıcı:')} ${member} (${member.id})`,
                `${bold('Sebep:')} ${reason}`,
                `${bold('Yetki Durumu:')} ${document.authBlock ? await client.getEmoji('check') : await client.getEmoji('mark')}`,
                `${bold('Yetki Engeli Tarihi:')} ${client.timestamp(Date.now())}`,
            ].join('\n'),
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async (i) => {
            i.deferUpdate();

            if (i.customId === 'block') {
                document.authBlock = true;
                document.authBlockReason = reason;
                document.authBlockDate = Date.now();
                document.authBlockStaff = message.author.id;
                await document.save();

                if (client.staff.check(member, ertu)) member.removeStaffRoles();
                
                question.edit({
                    content: 'Kullanıcıya yetki engeli eklendi!',
                    embeds: [],
                    components: [],
                })
            } else if (i.customId === 'unblock') {
                document.authBlock = false;
                document.authBlockReason = '';
                document.authBlockDate = 0;
                document.authBlockStaff = '';
                await document.save();
                
                question.edit({
                    content: 'Kullanıcıdan yetki engeli kaldırıldı!',
                    embeds: [],
                    components: [],
                })
            }

            const logChannel = await client.getChannel(client.data.logs.staffblock, message)
            if (!logChannel) return;

            logChannel.send({
                embeds: [
                    new EmbedBuilder({
                        color: client.getColor('random'),
                        description: [
                            `${member} (${member.id}) kullanıcısına yetki engeli ${i.customId === 'block' ? 'eklendi' : 'kaldırıldı'}!`,
                            '',
                            `${bold('Yetki Durumu:')} ${document.authBlock ? await client.getEmoji('check') : await client.getEmoji('mark')}`,
                            `${bold('Yetki Engeli Tarihi:')} ${client.timestamp(Date.now())}`,
                            `${bold('Yetki Engeli Sebebi:')} ${document.authBlockReason || 'Belirtilmemiş'}`,
                            `${bold('Yetki Engeli Ekleyen Yetkili:')} <@${message.author.id}> (${message.author.id})`
                        ].join('\n'),
                    })
                ],
            });
        });     
    },
};
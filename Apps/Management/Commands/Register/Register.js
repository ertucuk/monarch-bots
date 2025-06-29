const { PermissionsBitField: { Flags }, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, inlineCode } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas/')

module.exports = {
    Name: 'kayıt',
    Aliases: ['k', 'e', 'erkek', 'kadın', 'kayıt', 'register', 'kaydet', 'kayit', 'kadin'],
    Description: 'Belirttiğiniz kullanıcıyı kayıt edersiniz.',
    Usage: 'kayıt <@User/ID>',
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
        if (ertu.systems.register == false) {
            client.embed(message,
                '🔒 Kayıtlar bir yönetici tarafından __geçici bir süreliğine kapatılmıştır.__ Lütfen bu süreçte beklemede kalın. Anlayışla karşıladığınız için teşekkürler!'
            );
            return;
        }

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

        if (ertu.settings.manRoles.some((r) => member.roles.cache.has(r)) || ertu.settings.womanRoles.some((r) => member.roles.cache.has(r))) {
            client.embed(message, 'Bu üye zaten kayıtlı.');
            return;
        }

        if (client.functions.checkUser(message, member)) return;

        let name;
        if (ertu.systems.needName) {
            args = args.splice(1)
            name = args.filter((arg) => isNaN(parseInt(arg))).map((arg) => arg[0].toUpperCase() + arg.slice(1).toLowerCase()).join(' ');

            if (!name || name.length > 15) {
                client.embed(message, '15 karakteri geçmeyecek isim girmelisin.');
                return;
            };
        };

        if (ertu.systems.needAge) {
            const age = args.filter((arg) => !isNaN(parseInt(arg)))[0] || undefined;
            if (!age || age.length > 2) {
                client.embed(message, '2 karakteri geçmeyecek yaş girmelisin.');
                return;
            };

            const numAge = Number(age);
            if (ertu.settings.minAge && ertu.settings.minAge > numAge) {
                client.embed(
                    message,
                    `Sunucuya ${inlineCode(ertu.settings.minAge.toString())} yaşının altındaki üyeleri kaydedemezsin.`,
                );
                return;
            }

            name = `${name} | ${age}`;
        };

        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'man',
                    label: 'Erkek',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    custom_id: 'woman',
                    label: 'Kadın',
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

        const document = await UserModel.findOne({ id: member.id });
        const question = await message.channel.send({
            embeds: [
                embed.setFooter({ text: 'Bu kayıt işlemine 30 Saniye içerisinde tepki vermezseniz, işlem otomatik olarak iptal edilir.' }).setDescription([
                    `${member}, isimli üyenin kayıt işlemini tamamlanabilmesi için lütfen aşağıda ki düğmelerden cinsiyeti seçiniz.`,
                    document?.nameLogs.filter(d => ['Erkek', 'Kadın'].includes(d.type)).length ? `**Bu üyenin daha önce kayıt olduğu isimler:** \n${document.nameLogs.filter(d => ['Erkek', 'Kadın'].includes(d.type)).map((log) => {
                        const [manRoles, womanRoles] = [ertu.settings.manRoles.filter(r => message.guild?.roles.cache.has(r)).map(r => message.guild?.roles.cache.get(r)) || [], ertu.settings.womanRoles.filter(r => message.guild?.roles.cache.has(r)).map(r => message.guild?.roles.cache.get(r)) || []];
                        return `[${client.timestamp(log.date)}] ${inlineCode(' ' + log.name + ' ')}: ${log.type === 'Erkek' ? manRoles.join('') : womanRoles.join('')}`
                    }).join('\n')}` : undefined
                ].filter(Boolean).join('\n\n'))
            ],
            components: [row],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i) => {
            i.deferUpdate();
            if (i.customId === 'man') {
                member.register(`${name}`, 'Man', message.member, question);
            } else {
                member.register(`${name}`, 'Girl', message.member, question);
            }
        });
    },
};
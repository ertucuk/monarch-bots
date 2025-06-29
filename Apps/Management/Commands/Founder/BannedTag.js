const { ContainerBuilder, SectionBuilder, TextDisplayBuilder, MessageFlags, SeparatorSpacingSize, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas')

module.exports = {
    Name: 'yasaklıtag',
    Aliases: ['yasaklı-tag', 'bannedtag', 'banned-tag'],
    Description: 'Yasaklı tag kontrol',
    Usage: 'yasaklıtag',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {

        if (ertu.settings?.bannedTags.length === 0) return message.channel.send({ content: 'Sunucunuzda yasaklı tag bulunmamaktadır.' });

        const container = new ContainerBuilder();

        const title = new TextDisplayBuilder().setContent('### Yasaklı Tag Bilgileri')
        container.addTextDisplayComponents(title);

        const section = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${ertu.settings.bannedTags.map(tag => `➥ \`${tag}:\` **${tagMemberCount(message, tag)}** üye`).join('\n')}`))
            .setButtonAccessory(
                new ButtonBuilder({
                    customId: 'controlBannedTag',
                    label: 'Kontrol Et',
                    style: ButtonStyle.Secondary,
                })
            );

        container.addSectionComponents(section);
        container.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

        const question = await message.channel.send({
            components: [container],
            flags: [
                MessageFlags.IsComponentsV2,
            ],
        })

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'controlBannedTag') {
                for (const tag of ertu.settings.bannedTags) {
                    const unBannedTagMembers = message.guild.members.cache.filter(m =>
                        m.user.displayName.includes(tag) &&
                        !m.roles.cache.has(ertu.settings.bannedTagRole)
                    ).map(x => x.id);

                    const bannedTagMembers = message.guild.members.cache.filter(m =>
                        !m.user.displayName.includes(tag) &&
                        m.roles.cache.has(ertu.settings.bannedTagRole)
                    ).map(x => x.id);

                    if (unBannedTagMembers.length === 0 && bannedTagMembers.length === 0) continue;

                    const msg = await i.reply({
                        content: `**${tag}** tagındaki üyelerin rolleri güncelleniyor...`
                    });

                    for (let i = 0; i < unBannedTagMembers.length; i++) {
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        const member = message.guild.members.cache.get(unBannedTagMembers[i]);
                        if (!member) continue;

                        member.send({
                            content: 'Merhaba, sunucumuzda yasaklı taglı olduğunuz için cezalı olarak belirlendiniz. Kayıt olmak için lütfen yasaklı tagı kaldırın.'
                        }).catch(() => { });

                        const isTag = member.displayName.includes(ertu.settings.tag) ? ertu.settings.tag : ertu.settings.secondTag;
                        member.setNickname(member.displayName.replace(isTag, '[YASAKLI-TAG]').replace(ertu.settings.secondTag, '[YASAKLI-TAG]')).catch(() => null);

                        if (member.roles.cache.has(message.guild.roles.premiumSubscriberRole.id)) {
                            await member.setRoles([
                                message.guild.roles.premiumSubscriberRole.id,
                                ertu.settings.bannedTagRole
                            ]);
                        } else {
                            await member.setRoles(ertu.settings.bannedTagRole);
                        }
                    }

                    for (let i = 0; i < bannedTagMembers.length; i++) {
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        const member = message.guild.members.cache.get(bannedTagMembers[i]);
                        if (!member) continue;

                        member.send({
                            content: 'Merhaba, sunucumuzda **yasaklı tagı** kaldırdığınız için yasaklı tagdan çıkarıldınız.'
                        })

                        const document = await UserModel.findOne({ id: member.id });
                        if (document && document.name && document.nameLogs) {
                            member.setNickname(`${member.tag()} ${document.name}`);
                            member.setRoles(document?.gender === 'Man' ? ertu.settings.manRoles : ertu.settings.womanRoles);
                        } else {
                            member.setNickname(`${member.tag()} ${ertu.settings.name}`);
                            member.setRoles(ertu.settings.unregisterRoles);
                        }
                    }

                    await msg.edit({
                        content: `${tag} tagındaki ${unBannedTagMembers.length} üyeye başarıyla yasaklı tag rolü verildi ve ${bannedTagMembers.length} üye cezalıdan çıkarıldı!`,
                    });
                }
            }
        });
    },
};

function tagMemberCount(message, tag) {
    let memberCount = 0;
    message.guild.members.cache.forEach(member => {
        if (member.user.displayName.includes(tag)) {
            memberCount++;
        }
    });
    return memberCount;
}
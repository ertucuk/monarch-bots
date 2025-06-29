const { EmbedBuilder, bold, inlineCode, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { SettingsModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Tag(client, oldUser, newUser, member, ertu) {
    const oldHasTag = ertu.settings.tag.split('').some((t) => oldUser.displayName.includes(t))
    const newHasTag = ertu.settings.tag.split('').some((t) => newUser.displayName.includes(t))

    const tagJoin = await client.getChannel(client.data.logs.tagjoin, member)
    const tagLeave = await client.getChannel(client.data.logs.tagleave, member)
    const staffLeave = await client.getChannel(client.data.logs.unstaff, member)
    if (!tagJoin || !tagLeave || !staffLeave) return;

    if (!oldHasTag && newHasTag) {
        member.roles.add(ertu.settings.familyRole)
        setTimeout(() => {
            member.setNickname(member.displayName.replace(ertu.settings.secondTag, ertu.settings.tag)).catch(() => { })
        }, 2000)

        return tagJoin.send({
            flags: [4096],
            embeds: [new EmbedBuilder({
                color: client.getColor('green'),
                title: 'Taglı Üye Tespit Edildi',
                description: [
                    `${member} adlı kullanıcı tagımızı alarak ailemize katıldı.`,
                    '',
                    `→ Kullanıcı: ${member} (${inlineCode(member.user.id)})`,
                    `→ Tarih: ${client.timestamp(Date.now())}`,
                ].join('\n'),
            })],
        }).catch(() => null);
    }

    const returnRoles = member.guild.roles.cache.filter((role) => role.name.includes('Return')).map(role => `<@&${role.id}>`).join(', ');

    if (oldHasTag && !newHasTag) {
        member.roles.remove(ertu.settings.familyRole)
        setTimeout(() => {
            member.setNickname(member.displayName.replace(ertu.settings.tag, ertu.settings.secondTag)).catch(() => { })
        }, 2000)

        const staffButton = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'tag:' + member.id,
                    label: 'İlgileniyorum',
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

        tagLeave.send({
            components: [staffButton],
            content: returnRoles || null,
            flags: [4096],
            embeds: [new EmbedBuilder({
                color: client.getColor('red'),
                title: 'Tagsız Üye Tespit Edildi',
                description: [
                    `${member} adlı kullanıcı tagımızı çıkararak ailemizden ayrıldı.`,
                    '',
                    `→ Kullanıcı: ${member} (${inlineCode(member.user.id)})`,
                    `→ Tarih: ${client.timestamp(Date.now())}`,
                ].join('\n'),
            })],
        }).catch(() => null);

        const lowestRole = member.guild.roles.cache.get(ertu.settings.minStaffRole);

        await SettingsModel.updateOne(
            { id: member.guild.id },
            {
                $push: {
                    tagLeaves: {
                        id: member.id,
                        timestamp: Date.now(),
                        roles: member.roles.cache.filter((r) => lowestRole.position < r.position && !r.managed && r.id !== member.guild.id).map((r) => r.id)
                    }
                }
            }
        );

        if (ertu.settings.staffs.some(x => member.roles.cache.has(x))) {
            const roles = member.roles.cache.filter((role) => role.position >= lowestRole.position)

            const roleName = roles.map((role) => role?.name || 'Bilinmeyen Rol').join(', ');

            const staffButton = new ActionRowBuilder({
                components: [
                    new ButtonBuilder({
                        custom_id: 'staff:' + member.id,
                        label: 'İlgileniyorum',
                        style: ButtonStyle.Secondary,
                    }),
                ],
            });

            staffLeave.send({
                flags: [4096],
                components: [staffButton],
                content: returnRoles || null,
                embeds: [new EmbedBuilder({
                    color: client.getColor('red'),
                    title: 'Tagsız Yetkili Tespit Edildi',
                    description: [
                        `${member} adlı yetkili tagımızı çıkararak ailemizden ayrıldı.`,
                        '',
                        `→ Kullanıcı: ${member} (${inlineCode(member.user.id)})`,
                        `→ Tarih: ${client.timestamp(Date.now())}`,
                        `→ Rolleri: ${roleName}`,
                    ].join('\n'),
                })],
            }).catch(() => null);

            await SettingsModel.updateOne(
                { id: member.guild.id },
                {
                    $push: {
                        staffLeaves: {
                            id: member.id,
                            timestamp: Date.now(),
                            roles: member.roles.cache.filter((r) => lowestRole.position < r.position && !r.managed && r.id !== member.guild.id).map((r) => r.id)
                        }
                    }
                }
            );
        }

        setTimeout(async () => {
            await member.removeStaffRoles()
        }, 3000)
    }
}
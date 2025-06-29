const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Guild, StringSelectMenuBuilder, bold, inlineCode } = require('discord.js');

module.exports = {
    Name: 'sorumlulukpanel',
    Aliases: ['respanel'],
    Description: 'Sorumluluk panelini açar.',
    Usage: 'sorumlulukpanel',
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
        if (!ertu.settings.staffResponsibilities.length) return message.channel.send({ content: 'Sunucuda hiçbir sorumluluk tanımlanmamış.' });

        message.channel.send({
            components: createRow(client, message.guild, ertu.settings.staffResponsibilities),
            content: [
            `## Merhaba ${bold(inlineCode(message.guild?.name || 'ertu'))} sorumluluk seçim paneline hoşgeldiniz.`,

            '### Bu bölümde yetkili olduğunuz için kendinize uygun sorumlulukları alabilirsiniz.',

            `- Yetkiniz bu kapsamda ise, minimum ${bold('1')} ve maksimum ${bold('2')} sorumluluk üstlenebilirsiniz.`,
            ertu.staffRanks.filter(r => r.type === 'sub' && message.guild?.roles.cache.has(r.role)).map(r => message.guild?.roles.cache.get(r.role)).listArray(),

            `- Yetkiniz bu kapsamda ise, minimum ${bold('1')} ve maksimum ${bold('3')} sorumluluk üstlenebilirsiniz.`,
            ertu.staffRanks.filter(r => r.type === 'middle' && message.guild?.roles.cache.has(r.role)).map(r => message.guild?.roles.cache.get(r.role)).listArray(),

            `- Yetkiniz bu kapsamda ise, minimum ${bold('2')} ve maksimum ${bold('3')} sorumluluk üstlenebilirsiniz.`,
            ertu.staffRanks.filter(r => r.type === 'top' && message.guild?.roles.cache.has(r.role)).map(r => message.guild?.roles.cache.get(r.role)).listArray(),

            `-# Not: Seçtiğiniz sorumluluklar, yönetici ekibimiz tarafından onaylanacaktır. Onay süreci bitene kadar yeni bir seçim yapamazsınız.`,
            ].join('\n\n'),
        })
    },
};

function createRow(client, guild, data) {
    const responsibilitys = data.filter((r) => guild.roles.cache.has(r));
    const chunks = client.functions.chunkArray(responsibilitys, 25);

    const rows = [];
    let page = 0;

    for (const chunk of chunks) {
        page++;

        if (page === 3) break;
        rows.push(
            new ActionRowBuilder({
                components: [
                    new StringSelectMenuBuilder({
                        customId: 'responsibility:' + page,
                        placeholder: `Sorumluluk Seçin`,
                        options: chunk.map((r) => {
                            const role = guild.roles.cache.get(r);
                            return {
                                label: `${role?.name}`,
                                value: role?.id,
                            };
                        })
                    })
                ]
            })
        )
    };

    return rows;
}
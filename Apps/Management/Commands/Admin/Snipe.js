const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const { SettingsModel } = require('../../../../Global/Settings/Schemas');
const moment = require('moment');
moment.locale('tr');

module.exports = {
    Name: 'snipe',
    Aliases: ['sn'],
    Description: 'Kanalda silinen en son mesajı/resmi görüntülersiniz.',
    Usage: 'snipe',
    Category: 'Admin',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {

        const channel = message.guild.channels.cache.get(args[0]) || message.channel;

        const data = await SettingsModel.findOne({ id: message.guild.id });
        if (!data) {
            client.embed(message, 'Sunucu ayarları bulunamadı.');
            return;
        }

        let snipes = data.snipesData.filter(snipe => snipe.channel === channel.id) || [];
        if (!snipes.length) {
            client.embed(message, 'Bu kanalda silinen mesaj bulunamadı.');
            return;
        }

        const snipedMessages = snipes.slice(-25, -1).reverse();

        const lastSnipe = snipes[snipes.length - 1];
        const embed = new EmbedBuilder({
            color: client.getColor('random'),
            description: [
                `Yazan Kişi: <@${lastSnipe.author}>`,
                `Silinme Tarihi: ${client.timestamp(lastSnipe.deleted, 'f')} (${client.timestamp(lastSnipe.deleted)})`,
                `Mesaj İçeriği: ${lastSnipe.content ? (lastSnipe.content.length > 200 ? lastSnipe.content.slice(0, 200) + '...' : lastSnipe.content) : 'Resim bulunuyor.'}`,
            ].join('\n'),
        });

        const anotherEmbed = [...lastSnipe.attachments.values()].map((img) => {
                return new EmbedBuilder({
                    image: { url: img },
                });
            });

        const row = new ActionRowBuilder({
            components: [
                new StringSelectMenuBuilder({
                    customId: 'delete',
                    placeholder: 'Silinen mesajları görmek için tıkla!',
                    options: snipedMessages.map(snipe => ({
                        label: formatSnipe(snipe, message),
                        description: `Silinme Tarihi: ${moment(snipe.deleted).format('LLL')}`,
                        value: String(snipe.id)
                    })),
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [embed, ...anotherEmbed],
            components: [row],
        });
        const collector = question.createMessageComponentCollector({
            time: 1000 * 60 * 2,
        });

        collector.on('collect', async (i) => {
            const snipe = data.snipesData.find(snipe => String(snipe.id) === i.values[0]);

            const embed = new EmbedBuilder({
                color: client.getColor('random'),
                description: [
                    `> Yazan Kişi: <@${snipe.author}>`,
                    `> Silinme Tarihi: ${client.timestamp(snipe.deleted, 'f')} (${client.timestamp(snipe.deleted)})`,
                    `> Mesaj İçeriği: ${snipe.content ? (snipe.content.length > 200 ? snipe.content.slice(0, 200) + '...' : snipe.content) : 'Resim bulunuyor.'}`,
                ].join('\n'),
            })

            const anotherEmbed = [...snipe.attachments.values()].map((img) => {
                return new EmbedBuilder({
                    image: { url: img },
                });
            });

            i.reply({ embeds: [embed, ...anotherEmbed], ephemeral: true });
        });

        collector.on('end', () => {
            question.delete().catch(() => null);
        });
    },
};

function formatSnipe(snipe, message) {
    const member = message.guild?.members?.cache?.get(snipe.author)?.user || { username: 'Bilinmiyor' };
    return `${member.username}: ${snipe.content ? (snipe.content.length > 50 ? snipe.content.slice(0, 50) + '...' : snipe.content) : 'Resim bulunuyor.'}`;
}
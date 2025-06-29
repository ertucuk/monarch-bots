const { EmbedBuilder, bold } = require('discord.js');

module.exports = {
    Name: 'sil',
    Aliases: ['temizle'],
    Description: 'Kanalda belirtilen sayıda mesaj siler.',
    Usage: 'sil <mesaj sayısı>',
    Category: 'Admin',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {
        const amount = parseInt(args[0]);
        if (!amount || isNaN(amount)) return client.embed(message, 'Lütfen silinecek mesaj sayısını belirtiniz!');
        if (amount < 1 || amount > 100) return client.embed(message, 'Lütfen 1-100 arasında bir sayı belirtiniz!');

        const fetched = await message.channel.messages.fetch({ limit: amount });

        const logChannel = await client.getChannel(client.data.logs.delete, message);
        if (logChannel) {
            const deletedList = fetched.map(msg =>
                `${bold(msg.author.tag)}: ${msg.content ? msg.content.slice(0, 100) : 'Resim/Embed'}`
            ).join('\n') || 'Silinen mesaj bulunamadı.';

            const logEmbed = new EmbedBuilder({
                title: 'Mesaj Silme Log',
                color: client.getColor('random'),
                description: `**${message.author}** tarafından **${amount}** mesaj silindi!\n\n**Silinen Mesajlar:**\n${deletedList}`,
            })
        
            logChannel.send({ embeds: [logEmbed] });
        }

        message.channel.bulkDelete(amount).catch(err => { });
        message.channel.send({
            embeds: [
                embed.setDescription(`Başarıyla ${amount} adet mesaj silindi!`)
            ]
        }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
    },
};
module.exports = {
    Name: 'rolstat',
    Aliases: ['rol-stat'],
    Description: 'Belirttiğiniz roldeki üyelerin istatistik durumlarını gösterir.',
    Usage: 'rolstat <@Rol/ID>',
    Category: 'Admin',
    Cooldown: 0,

    Command: { Prefix: true },

    messageRun: async (client, message, args) => {

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role || role.id === message.guild?.id) {
            client.embed(message, 'Geçerli bir rol belirtmelisiniz.');
            return;
        }

        const roleMembers = message.guild.members.cache.filter((m) => m.roles.cache.has(role.id));
        if (roleMembers.size === 0) {
            client.embed(message, 'Bu rolde üye bulunmamaktadır.');
            return;
        }

        let stats = [];

        for (const member of roleMembers.values()) {
            const document = await member.stats();
            if (!document) continue;
            if (document.voice === 0 && document.message === 0) continue;

            stats.push({
                member: member,
                voice: document.voice,
                message: document.message
            });
        }

        const voiceSorted = [...stats].sort((a, b) => b.voice - a.voice);
        const messageSorted = [...stats].sort((a, b) => b.message - a.message);

        let voiceList = voiceSorted.map((x, i) => `${i + 1}. ${x.member}: \`${client.functions.formatDurations(x.voice)}\``).join('\n');
        let messageList = messageSorted.map((x, i) => `${i + 1}. ${x.member}: \`${x.message} mesaj\``).join('\n');

        const array = [
            `**Seste En Fazla Olan Üyeler:**\n${voiceList || 'Veri bulunamadı.'}`,
            `**En Çok Mesaj Gönderen Üyeler:**\n${messageList || 'Veri bulunamadı.'}`
        ]

        for (const content of array) {
            if (content.length > 2000) {
                const chunks = client.functions.splitMessage(content, { maxLength: 2000 });
                for (const chunk of chunks) {
                    await message.channel.send({ content: chunk });
                }
            } else {
                await message.channel.send({ content });
            }
        }
    }
};
module.exports = {
    Name: 'rolsorgu',
    Aliases: ['rs', 'rol-sorgu', 'role-sorgu', 'rolequery', 'rolquery', 'rol-query', 'role-query'],
    Description: 'Belirttiğiniz rolün detaylarını görüntülersiniz.',
    Usage: 'rolsorgu <@Role/ID>',
    Category: 'Admin',
    Cooldown: 0,

    Command: { Prefix: true },

    messageRun: async (client, message, args) => {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role || role.id === message.guild?.id) {
            message.reply({ content: "Geçerli bir rol belirtmelisiniz." }).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
            return;
        }

        const members = await message.guild.members.fetch();
        const roleMembers = members.filter(m => m.roles.cache.has(role.id));
        const offlineMembers = message.guild.members.cache.filter((m) => m.roles.cache.has(role.id) && m.presence && m.presence?.status === 'offline');
        const onlineMembers = message.guild.members.cache.filter((m) => m.roles.cache.has(role.id) && m.presence && m.presence?.status !== 'offline');
        const notVoiceMembers = message.guild.members.cache.filter((m) => m.roles.cache.has(role.id) && !m.voice.channelId);
        const notVoiceText = notVoiceMembers.size > 0 ? notVoiceMembers.map((member) => `${member} [\`${member.displayName}\`] (${member.id})`).join('\n') : 'Seste olmayan üye bulunmakamaktadır.';
        const voiceMembers = message.guild.members.cache.filter((m) => m.roles.cache.has(role.id) && m.voice.channelId);
        const voiceText = voiceMembers.size > 0 ? voiceMembers.map((member) => `${member} [\`${member.displayName}\`] (<#${member.voice.channelId}>)`).join('\n') : 'Seste olan üye bulunmamaktadır.';

        const text = [
            `**Rol Adı:** ${role.name} (${role.id})`,
            `**Rol Rengi:** ${role.hexColor}`,
            `**Rol Pozisyonu:** ${role.position}`,
            `**Roldeki Üye Sayısı:** ${roleMembers.size}`,
            `**----------------------------------------**`,
            `**Üyeler (\`Aktif - Seste Olmayan\`) (\`${onlineMembers.size} üye\`)**`,
            `**----------------------------------------**`,
            `${notVoiceText}`,
            `**----------------------------------------**`,
            `**Üyeler (\`Seste Olanlar\`) (\`${voiceMembers.size} üye\`)**`,
            `**----------------------------------------**`,
            `${voiceText}`,
            `**----------------------------------------**`,
            `**Üyeler (\`Çevrimdışı\`) (\`${offlineMembers.size} üye\`)**`,
            `**----------------------------------------**`,
            `${offlineMembers.size > 0 ? offlineMembers.map((member) => `${member} [\`${member.displayName}\`] (${member.id})`).join('\n') : 'Çevrimdışı üye bulunmamaktadır.'}`
        ].join('\n')

        if (text.length > 1900) {
            const chunks = client.functions.splitMessage(text, { maxLength: 1900 });
            for (const chunk of chunks) {
                await message.channel.send({ content: chunk });
            }
        } else {
            await message.channel.send({ content: text });
        }
    },
};

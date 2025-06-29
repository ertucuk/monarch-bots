const { PermissionsBitField: { Flags }, codeBlock } = require('discord.js');

module.exports = {
    Name: 'seste',
    Aliases: [],
    Description: 'Belirttiğiniz rolün üye bilgilerini gösterir.',
    Usage: 'roldenetim <@Rol/ID>',
    Category: 'Admin',
    Cooldown: 0,

    Command: { Prefix: true },

    messageRun: async (client, message, args) => {

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role || role.id === message.guild?.id) {
            client.embed(message, 'Geçerli bir rol belirtmelisiniz.');
            return;
        }

        const members = message.guild.members.cache.filter((member) => member.roles.cache.has(role.id));
        if (!members.size) {
            client.embed(message, 'Belirtilen rolde üye bulunamadı.');
            return;
        }

        const voiceStates = [];
        members.forEach(member => {
            const voiceState = member.voice.channel;
            voiceStates.push({
                member: member,
                inVoice: !!voiceState,  
                channelName: voiceState?.name || ''
            });
        });

        let content = `Üye Bilgileri: ${role.name}\n`;
        content += `Üye Sayısı: ${members.size}\n`;
        content += `Sesteki Üye Sayısı: ${voiceStates.filter(s => s.inVoice).length}\n\n`;

        const chunks = [];
        let currentChunk = '';

        voiceStates.forEach((state) => {
            const line = `• ${state.member.user.tag} | ${state.inVoice ? 'Seste |' : 'Seste Değil'} ${state.channelName}\n`;

            if (currentChunk.length + line.length > 1900) {
                chunks.push(currentChunk);
                currentChunk = line;
            } else {
                currentChunk += line;
            }
        });

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        for (const chunk of chunks) {
            const fullContent = content + chunk;
            await message.channel.send({ content: codeBlock('yaml', fullContent) });
        }
    }
};
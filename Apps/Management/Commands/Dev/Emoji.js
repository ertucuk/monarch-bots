const { PermissionsBitField: { Flags }, parseEmoji } = require('discord.js');

module.exports = {
    Name: 'emoji',
    Aliases: ['emojiekle', 'emoji-ekle'],
    Description: 'Sunucuya emoji ekler.',
    Usage: 'emoji <emoji>',
    Category: 'Roor',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args) => {
        if (args.length === 0) {
            client.embed(message, 'Geçerli bir emoji belirtmelisiniz.');
            return;
        }

        if (args.length >= 5) {
            client.embed(message, 'En fazla 5 emoji ekleyebilirsiniz.')
            return;
        }

        const emojiString = args.join(' ');
        const emojiList = emojiString.split('<');

        const results = await Promise.all(
            emojiList.slice(1).map(async (emojiPart, i) => {
                const isAnimated = emojiPart.includes('a:');
                emojiPart = emojiPart
                    .trim()
                    .replace(/^a:/, '')
                    .replace(/^:/, '')
                    .replace(/>$/, '');
                const parseCustomEmoji = parseEmoji(
                    `<${isAnimated ? 'a:' : ''}${emojiPart}`
                );

                if (!parseCustomEmoji.id) { 
                    return `Emoji bulunamadı.`;
                }

                const emojiLink = `https://cdn.discordapp.com/emojis/${parseCustomEmoji.id}.${isAnimated ? 'gif' : 'png'}`;

                try {
                    const createdEmoji = await message.guild.emojis.create({
                        attachment: emojiLink,
                        name: parseCustomEmoji.name,
                    });

                    return `${createdEmoji} emojisi sunucuya eklendi.`;
                } catch (error) {
                    return `Emoji eklenirken bir hata oluştu.`;
                }
            })
        );

        if (results.length === 0) return message.reply({ content: 'Geçerli bir emoji belirtmelisin.' });
        message.reply({ content: results.join('\n') });
    },
};

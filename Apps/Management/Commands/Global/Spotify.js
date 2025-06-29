const { ActivityType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    Name: 'spotify',
    Aliases: ['spo'],
    Description: 'Spotify Kardı Atar',
    Usage: 'spotify <@User/ID>',
    Category: 'Global',
    Cooldown: 10,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu, embed) => {
        await message.channel.sendTyping();

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

        if (member && member.presence && member.presence.activities && member.presence.activities.some(activity => activity.name == 'Spotify' && activity.type == ActivityType.Listening)) {
            const status = await member.presence.activities.find(activity => activity.type == ActivityType.Listening);
            const songName = status.details;
            const artistName = status.state;
            const albumName = status.assets.largeText;
            const albumArt = `https://i.scdn.co/image/${status.assets.largeImage.slice(8)}`;
            const spotifyTrackId = status.syncId;
            const spotifyUrl = `https://open.spotify.com/track/${spotifyTrackId}`;

            const startTime = new Date(status.timestamps.start).getTime();
            const endTime = new Date(status.timestamps.end).getTime();
            const currentTime = new Date().getTime();
            const elapsedTime = currentTime - startTime;
            const totalDuration = endTime - startTime;

            const currentTimeFormatted = formatTime(elapsedTime);
            const totalTimeFormatted = formatTime(totalDuration);
            const progressPercentage = Math.min(100, (elapsedTime / totalDuration) * 100);

            const image = await client.functions.generateSpotifyCard(member, message, progressPercentage, albumArt, songName, artistName, albumName, currentTimeFormatted, totalTimeFormatted);
            if (!image) return message.reply({ content: 'Bir hata oluştu, lütfen daha sonra tekrar deneyin.' });

            const spotifyButton = new ButtonBuilder()
                .setLabel('Dinle')
                .setStyle(ButtonStyle.Link)
                .setURL(spotifyUrl)
            const albumButton = new ButtonBuilder()
                .setLabel('Albüm')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://open.spotify.com/search/${encodeURIComponent(status.assets.largeText)}`)

            const artistButton = new ButtonBuilder()
                .setLabel('Sanatçı')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://open.spotify.com/search/${encodeURIComponent(artistName)}`)


            const row = new ActionRowBuilder().addComponents(spotifyButton, albumButton, artistButton);

            await message.reply({
                files: [{
                    attachment: image,
                    name: `spotify-${message.author.id}.png`
                }],
                components: [row]
            });
        } else {
            message.reply({ content: 'Kullanıcı şu anda Spotify dinlemiyor.' })
        }
    }
}

function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

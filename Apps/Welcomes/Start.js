const { ChannelType } = require('discord.js')
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice')
const { Presence } = require('../../Global/Helpers')
const { Client } = require('./Client')
const { Welcome, serverID } = require('../../Global/Settings/System')

for (let i = 0; i < Welcome.Tokens.length; i++) {
    const token = Welcome.Tokens[i]
    const channel = Welcome.Channels.length > 0 ? Welcome.Channels[i] : Welcome.Channels[0]

    if (token && channel) {
        const client = new Client()
        client.on('ready', async () => {
            Presence(client);

            const Server = client.guilds.cache.get(serverID);
            const Channel = Server ? Server.channels.cache.get(channel) : null;

            if (!Server || !Channel) throw new Error('Sunucu veya kanal bulunamadı');

            join({ channel: Channel, client, selfDeaf: true, selfMute: true, Interval: true })
        });

        client.login(token).then(() => { console.log(`[BOT] ${client.user.tag} olarak giriş yaptı!`) }).catch((err) => { console.log(`Başlatılamadı! Hata: ${err}`) })
    }
}

function join({ channel, client, selfDeaf = false, selfMute = false, Interval = false } = {}) {
    if (channel.type !== ChannelType.GuildVoice) {
        client.logger.error('the specified channel is not an audio channel!')
        return;
    }

    const connection = getVoiceConnection(channel.guild.id)
    if (connection) return;

    joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        group: client.user.id,
        selfDeaf: selfDeaf,
        selfMute: selfMute
    })

    if (Interval) {
        setInterval(async () => {
            const VoiceChannel = client.channels.cache.get(channel.id);
            if (VoiceChannel) {
                joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                    group: client.user.id,
                    selfDeaf: selfDeaf,
                    selfMute: selfMute
                })
            }
        }, 20000);
    }
}
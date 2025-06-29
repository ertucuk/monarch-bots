const { bold, inlineCode, EmbedBuilder } = require('discord.js');
const { UserModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Voice(client, state, ertu, action) {
    const logChannel = await client.getChannel(client.data.logs.voice, state);
    const now = Date.now();

    try {
        logChannel.send({
            embeds: [
                new EmbedBuilder({
                    author: { name: state.member?.user.username, icon_url: state.member?.user.displayAvatarURL({ dynamic: true }) },
                    description: [
                        `${state.member} adlı üye ${state.channel} ses ${action ? 'kanalından ayrıldı.' : 'kanalına katıldı.'}`,
                        '',
                        `${bold(`${action ? 'Kanaldan Çıktığı Anda' : 'Kanala Katıldığı Anda'}`)}`,
                        `${await client.getEmoji('point')} Mikrofonu: ${state.mute ? '**Kapalı**' : '**Açık**'}`,
                        `${await client.getEmoji('point')} Kulaklığı: ${state.seldDeaf ? '**Açık**' : '**Kapalı**'}`,
                        '',
                        `${await client.getEmoji('point')} Girdiği Kanal: ${inlineCode(state.channel.name + ` (${state.channel.id})`)}`,
                        `${await client.getEmoji('point')} Eylem Gerçekleşme: ${client.timestamp(Date.now())}\n`,
                        `${bold('Kanaldaki Üyeler:')}`,
                        `${25 > state.channel.members.size ? state.channel.members.map((m) => `→ ${m} [${m.displayName}]`).join('\n') : 'Üye yok!'}`
                    ].join('\n'),
                })
            ]
        });

        if (!state.member?.user.bot) await UserModel.updateOne(
            { id: state.member?.id },
            {
                $push: {
                    voiceLogs: {
                        type: action ? 'Leave' : 'Join',
                        date: now,
                        channel: state?.channelId,
                    }
                }
            },
            { upsert: true }
        ).catch(() => null);
    } catch (error) {
        client.logger.error('@Voice ->', error);
    }
}
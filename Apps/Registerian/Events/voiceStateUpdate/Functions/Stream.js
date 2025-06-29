const { bold, inlineCode, EmbedBuilder } = require('discord.js');

module.exports = async function Stream(client, state, ertu, action) {
    const logChannel = await client.getChannel(client.data.logs.voice, state);

    try {
        logChannel.send({
            embeds: [
                new EmbedBuilder({
                    author: { name: state.member?.user.username, icon_url: state.member?.user.displayAvatarURL({ dynamic: true }) },
                    description: [
                        `${state.member} adlı üye ${state.channel} ${action ? 'yayınını kapattı.' : 'yayın açtı.'}`,
                        '',
                        `${bold(`${action ? 'Kapattığı Anda' : 'Açtığı Anda'}`)}`,
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
    } catch (error) {
        client.logger.error('@Stream ->', error);
    }
}
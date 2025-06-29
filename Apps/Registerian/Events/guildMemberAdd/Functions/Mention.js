module.exports = async function Mention(client, member, ertu) {
    const channels = ertu.settings.mentionChannels || [];
    if (!channels.length) return;

    for (const id of channels) {
        const channel = member.guild.channels.cache.get(id);
        if (!channel) continue;

        channel.send({
            content: member.toString()
        }).then((msg) => {
            setTimeout(() => msg.delete(), 2000);
        });
    };
}
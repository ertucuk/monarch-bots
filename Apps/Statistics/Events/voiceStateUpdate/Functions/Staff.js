const { JoinModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Staff(client, oldState, newState, ertu) {

    const member = oldState.guild.members.cache.get(oldState.id);
    if (!client.staff.check(member, ertu)) return;

    if (oldState.channel && !newState.channel) {
        const data = await JoinModel.findOne({ id: oldState.id });
        if (!data) return;

        const time = Date.now() - data.voice;
        if (time <= 0) return;

        const category = oldState.guild.channels.cache.get(oldState.channelId)?.parent;
        if (!category) return;

        const afkChannels = oldState.channel.name.toLowerCase().includes('sleep') || oldState.channel.name.toLowerCase().includes('afk');

        const minutes = Math.max(Math.floor(time / (1000 * 60)), 1);
        client.staff.checkRank(client, member, ertu, { type: 'generalVoicePoints', amount: time });
        if (afkChannels) client.staff.checkRank(client, member, ertu, { type: 'afkPoints', amount: time, point: minutes * 2 });
        if (category.id === ertu.settings.publicParent) client.staff.checkRank(client, member, ertu, { type: 'publicPoints', amount: time, point: minutes * 2 });
        if (category.id === ertu.settings.streamerParent) client.staff.checkRank(client, member, ertu, { type: 'streamerPoints', amount: time, point: minutes * 2 });
        if (category.id === ertu.settings.activityParent) client.staff.checkRank(client, member, ertu, { type: 'activityPoints', amount: time, point: minutes * 4 });
    }

    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const data = await JoinModel.findOne({ id: oldState.id });
        if (!data) return;

        const time = Date.now() - data.voice;
        if (time <= 0) return;

        const category = oldState.guild.channels.cache.get(oldState.channelId)?.parent;
        if (!category) return;

        const afkChannels = oldState.channel.name.toLowerCase().includes('sleep') || oldState.channel.name.toLowerCase().includes('afk');

        const minutes = Math.max(Math.floor(time / (1000 * 60)), 1);
        client.staff.checkRank(client, member, ertu, { type: 'generalVoicePoints', amount: time, point: minutes * 2 });
        if (afkChannels) client.staff.checkRank(client, member, ertu, { type: 'afkPoints', amount: time, point: minutes * 2 });
        if (category.id === ertu.settings.publicParent) client.staff.checkRank(client, member, ertu, { type: 'publicPoints', amount: time, point: minutes * 2 });
        if (category.id === ertu.settings.streamerParent) client.staff.checkRank(client, member, ertu, { type: 'streamerPoints', amount: time, point: minutes * 2 });
        if (category.id === ertu.settings.activityParent) client.staff.checkRank(client, member, ertu, { type: 'activityPoints', amount: time, point: minutes * 2 });
    }
}
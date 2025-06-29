const { JoinModel } = require('../../../../../Global/Settings/Schemas');

module.exports = async function Stat(client, oldState, newState) {

    if (!oldState.channel && newState.channel) {
        await JoinModel.updateOne(
            { id: newState.id },
            { $set: { voice: Date.now() } },
            { upsert: true }
        );
        return;
    }

    if (oldState.channel && !newState.channel) {
        const data = await JoinModel.findOne({ id: oldState.id });
        if (!data) return;

        const time = Date.now() - data.voice;

        if (time > 0) {
            client.functions.addStat({
                type: 'voice',
                member: oldState.member,
                channel: oldState.channel,
                value: time,
            })

            await JoinModel.deleteOne({ id: oldState.id });
            return;
        }
    }

    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const data = await JoinModel.findOne({ id: oldState.id });
        if (!data) return;

        const time = Date.now() - data.voice;

        if (time > 0) {
            client.functions.addStat({
                type: 'voice',
                member: oldState.member,
                channel: oldState.channel,
                value: time,
            })

            await JoinModel.updateOne(
                { id: newState.id },
                { $set: { voice: Date.now() } },
                { upsert: true }
            );
            return;
        }
    }

    if (!oldState.streaming && newState.streaming) {
        await JoinModel.updateOne(
            { id: newState.id },
            { $set: { stream: Date.now() } },
            { upsert: true }
        );
        return;
    }

    if (oldState.streaming && !newState.streaming) {
        const data = await JoinModel.findOne({ id: oldState.id });
        if (!data) return;
        
        const time = Date.now() - data.stream;

        if (time > 0) {
            client.functions.addStat({
                type: 'stream',
                member: oldState.member,
                channel: oldState.channel,
                value: time,
            })
            await JoinModel.updateOne({ id: oldState.id }, { $unset: { stream: 0 } });
            return;
        }
    }

    if (!oldState.selfVideo && newState.selfVideo) {
        await JoinModel.updateOne(
            { id: newState.id },
            { $set: { camera: Date.now() } },
            { upsert: true }
        );
        return;
    }

    if (oldState.selfVideo && !newState.selfVideo) {
        const data = await JoinModel.findOne({ id: oldState.id });
        if (!data) return;

        const time = Date.now() - data.camera;

        if (time > 0) {
            client.functions.addStat({
                type: 'camera',
                member: oldState.member,
                channel: oldState.channel,
                value: time,
            })
            await JoinModel.updateOne({ id: oldState.id }, { $unset: { camera: 0 } });
            return;
        }
    }
}
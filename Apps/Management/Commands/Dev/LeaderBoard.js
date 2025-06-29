const { EmbedBuilder, bold, inlineCode } = require('discord.js');
const { UserModel } = require('../../../../Global/Settings/Schemas')

module.exports = {
    Name: 'leaderboard',
    Aliases: ['leader-board'],
    Description: 'Liderlik tablosunu gösterir.',
    Usage: 'leaderboard',
    Category: 'Root',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {

        const Message = await UserModel.aggregate([
            { $project: { id: '$id', total: { $reduce: { input: { $objectToArray: `$messages` }, initialValue: 0, in: { $add: ['$$value', '$$this.v.total'] } } } } },
            { $match: { total: { $gt: 0 } } },
            { $sort: { total: -1 } },
            { $skip: 0 },
            { $limit: 50 },
            { $project: { id: 1, total: 1 } },
        ]);

        const Voice = await UserModel.aggregate([
            { $project: { id: '$id', total: { $reduce: { input: { $objectToArray: `$voices` }, initialValue: 0, in: { $add: ['$$value', '$$this.v.total'] } } } } },
            { $match: { total: { $gt: 0 } } },
            { $sort: { total: -1 } },
            { $skip: 0 },
            { $limit: 50 },
            { $project: { id: 1, total: 1 } },
        ]);

        const Stream = await UserModel.aggregate([
            { $project: { id: '$id', total: { $reduce: { input: { $objectToArray: `$streams` }, initialValue: 0, in: { $add: ['$$value', '$$this.v.total'] } } } } },
            { $match: { total: { $gt: 0 } } },
            { $sort: { total: -1 } },
            { $skip: 0 },
            { $limit: 50 },
            { $project: { id: 1, total: 1 } },
        ]);

        const Camera = await UserModel.aggregate([
            { $project: { id: '$id', total: { $reduce: { input: { $objectToArray: `$cameras` }, initialValue: 0, in: { $add: ['$$value', '$$this.v.total'] } } } } },
            { $match: { total: { $gt: 0 } } },
            { $sort: { total: -1 } },
            { $skip: 0 },
            { $limit: 50 },
            { $project: { id: 1, total: 1 } },
        ]);

        const MessageArray = [];
        const VoiceArray = [];
        const StreamArray = [];
        const CameraArray = [];

        Message.forEach((data, index) => {
            MessageArray.push({ id: data.id, total: data.total, i: index + 1 });
        });

        Voice.forEach((data, index) => {
            VoiceArray.push({ id: data.id, total: data.total, i: index + 1 });
        });

        Stream.forEach((data, index) => {
            StreamArray.push({ id: data.id, total: data.total, i: index + 1 });
        });

        Camera.forEach((data, index) => {
            CameraArray.push({ id: data.id, total: data.total, i: index + 1 });
        });

        const totalMessage = Message.reduce((acc, cur) => acc + cur.total, 0);
        const totalVoice = Voice.reduce((acc, cur) => acc + cur.total, 0);
        const totalStream = Stream.reduce((acc, cur) => acc + cur.total, 0);
        const totalCamera = Camera.reduce((acc, cur) => acc + cur.total, 0);

        const messageEmbed = new EmbedBuilder({
            color: client.getColor('random'),
            description: [
                `${await client.getEmoji('arrow')} **Liderlik Tablosu** (${inlineCode(' 7 Günlük Veriler ')})\n`,
                `${await client.getEmoji('point')} **Metin Kanalı İstatistikleri** (${inlineCode(` Toplam : ${totalMessage} adet `)})\n`,
                Message.map((data, index) =>
                    `${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `\` ${index + 1}. \``} <@${data.id}>: \` ${data.total} adet \``
                ).join('\n'),
                '',
                `**Güncellenme Tarihi:** ${client.timestamp(Date.now())}`
            ].join('\n'),
        });

        const voiceEmbed = new EmbedBuilder({
            color: client.getColor('random'),
            description: [
                `${await client.getEmoji('arrow')} **Liderlik Tablosu** (${inlineCode(' 7 Günlük Veriler ')})\n`,
                `${await client.getEmoji('point')} **Ses Kanalı İstatistikleri** (${inlineCode(`Toplam : ${client.functions.formatDurations(totalVoice)} `)})\n`,
                VoiceArray.map((data, index) =>
                    `${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `\` ${index + 1}. \``} <@${data.id}>: \` ${client.functions.formatDurations(data.total)} \``
                ).join('\n'),
                '',
                `**Güncellenme Tarihi:** ${client.timestamp(Date.now())}`
            ].join('\n'),
        });

        const streamEmbed = new EmbedBuilder({
            color: client.getColor('random'),
            description: [
                `${await client.getEmoji('arrow')} **Liderlik Tablosu** (${inlineCode(' 7 Günlük Veriler ')})\n`,
                `${await client.getEmoji('point')} **Yayın İstatistikleri** (${inlineCode(` Toplam : ${client.functions.formatDurations(totalStream)} `)})\n`,
                StreamArray.map((data, index) =>
                    `${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `\` ${index + 1}. \``} <@${data.id}>: \` ${client.functions.formatDurations(data.total)} \``
                ).join('\n'),
                '',
                `**Güncellenme Tarihi:** ${client.timestamp(Date.now())}`
            ].join('\n'),
        });

        const cameraEmbed = new EmbedBuilder({
            color: client.getColor('random'),
            description: [
                `${await client.getEmoji('arrow')} **Liderlik Tablosu** (${inlineCode(' 7 Günlük Veriler ')})\n`,
                `${await client.getEmoji('point')} **Kamera İstatistikleri** (${inlineCode(` Toplam : ${client.functions.formatDurations(totalCamera)} `)})\n`,
                CameraArray.map((data, index) =>
                    `${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `\` ${index + 1}. \``} <@${data.id}>: \` ${client.functions.formatDurations(data.total)} \``
                ).join('\n'),
                '',
                `**Güncellenme Tarihi:** ${client.timestamp(Date.now())}`
            ].join('\n'),
        });

        let sendMessageEmbed = await message.channel.send({
            embeds: [messageEmbed],
        });

        let sendVoiceEmbed = await message.channel.send({
            embeds: [voiceEmbed],
        });

        let sendStreamEmbed = await message.channel.send({
            embeds: [streamEmbed],
        });

        let sendCameraEmbed = await message.channel.send({
            embeds: [cameraEmbed],
        });

        await message.guild?.updateSettings({
            $set: {
                board: {
                    channel: message.channel.id,
                    message: sendMessageEmbed.id,
                    voice: sendVoiceEmbed.id,
                    stream: sendStreamEmbed.id,
                    camera: sendCameraEmbed.id,
                }
            }
        })
    },
};
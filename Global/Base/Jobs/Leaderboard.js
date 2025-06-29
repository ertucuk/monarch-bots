const { schedule } = require('node-cron');
const { SettingsModel, UserModel } = require('../../Settings/Schemas');
const { EmbedBuilder, bold, inlineCode } = require('discord.js');

module.exports = async function LeaderBoard(client, guild) {
    schedule('* * * * *', async () => {
        const document = await SettingsModel.findOne({ id: guild.id });
        if (!document) return;

        const channel = guild.channels.cache.get(document.board[0]?.channel);
        if (!channel) return;

        const messageBoard = await channel.messages.fetch(document.board[0].message).catch(() => null);
        const voiceBoard = await channel.messages.fetch(document.board[0].voice).catch(() => null);
        const streamBoard = await channel.messages.fetch(document.board[0].stream).catch(() => null);
        const cameraBoard = await channel.messages.fetch(document.board[0].camera).catch(() => null);

        if (!messageBoard || !voiceBoard || !streamBoard || !cameraBoard) {
            return await SettingsModel.findOneAndUpdate({ id: guild.id }, { $set: { board: {} } });
        }

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

        messageBoard.edit({ embeds: [messageEmbed] });
        voiceBoard.edit({ embeds: [voiceEmbed] });
        streamBoard.edit({ embeds: [streamEmbed] });
        cameraBoard.edit({ embeds: [cameraEmbed] });
    });
}
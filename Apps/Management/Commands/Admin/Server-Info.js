const { ChannelType } = require('discord.js');
const { Canvas, loadImage } = require('canvas-constructor/skia');
const path = require('path');

module.exports = {
    Name: 'say',
    Aliases: [],
    Description: 'Sunucu aktiflik bilgilerini gösterir.',
    Usage: 'say',
    Category: 'Admin',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {

        const members = await message.guild?.members.fetch();
        if (!members) return;
        if (!message.guild) return;

        const canvas = new Canvas(1135, 400);
        canvas.setColor('#111111');
        const guildBuffer = await loadImage(message.guild.iconURL({ extension: 'png', size: 4096 }) || 'https://cdn.discordapp.com/embed/avatars/0.png');
        const backgroundBuffer = await loadImage(path.resolve(__dirname, '../../../../Global/Assets/Images', 'Server.png'));
        canvas.printRoundedImage(backgroundBuffer, 0, 0, canvas.width, canvas.height, 20);
        canvas.printRoundedImage(guildBuffer, 20, 20, 70, 70, 20);

        canvas.setTextFont('normal 34px Kanit');
        canvas.setColor('#ffffff');
        canvas.setTextSize(34);
        canvas.printText(message.guild.name, 97, 45);

        canvas.setColor('#ded9d9');
        canvas.setTextSize(24);
        canvas.setTextFont('normal 24px Kanit');
        canvas.printText('Sunucu Aktiflik Bilgileri', 97, 80);

        const datas = [
            { name: 'Toplam Üye:', value: message.guild.memberCount, svg: 'members' },
            { name: 'Online Üye:', value: members.filter(m => m.presence?.status === 'online' || m.presence?.status === 'idle' || m.presence?.status === 'dnd').size, svg: 'online' },
            { name: 'Offline Üye:', value: members.filter(m => m.presence?.status !== 'online' && m.presence?.status !== 'idle' && m.presence?.status !== 'dnd').size, svg: 'offline' },
            { name: 'Mobil Sayısı:', value: members.filter(m => m.presence?.clientStatus?.mobile).size, svg: 'mobile' },
            { name: 'Masaüstü Sayısı:', value: members.filter(m => m.presence?.clientStatus?.desktop).size, svg: 'desktop' },
            { name: 'Web Sayısı:', value: members.filter(m => m.presence?.clientStatus?.web).size, svg: 'web' },
            { name: 'Sesteki Üye:', value: members.filter(m => m.voice.channel).size, svg: 'voice' },
            { name: 'Yayın Sayısı:', value: members.filter(m => m.voice.streaming).size, svg: 'streamer' },
            { name: 'Kamera Sayısı:', value: members.filter(m => m.voice.selfVideo).size, svg: 'camera' },
            { name: 'Ses AFK Sayısı:', value: members.filter(m => m.voice.channel?.id === message.guild.afkChannelId).size, svg: 'afk' },
            { name: 'Ses Sust. Sayısı:', value: members.filter(m => m.voice.serverMute).size, svg: 'mute' },
            { name: 'Taglı Sayısı:', value: members.filter(m => m.user.displayName.includes(ertu.settings.tag)).size + 1000, svg: 'tag' }
        ];

        const boxWidth = 350;
        const boxHeight = 50;
        const startX = 20;
        const startY = 120;
        const padding = 20;

        for (let i = 0; i < datas.length; i++) {
            const data = datas[i];
            const row = Math.floor(i / 3);
            const col = i % 3;
            const x = startX + col * (boxWidth + padding);
            const y = startY + row * (boxHeight + padding);

            canvas.setColor('#FFFFFF')
            canvas.setTextFont('normal 20px Kanit')
            canvas.printText(data.name, x + 45, y + 31)
            canvas.setTextFont('bold 22px Kanit')
            canvas.printText(format(data.value), x + 40 + canvas.measureText(data.name).width, y + 31);
        }

        message.channel.send({
            files: [
                {
                    attachment: canvas.toBuffer(),
                    name: 'count.png'
                }
            ]
        });
    },
};

function format(number) {
    let parts = number.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}
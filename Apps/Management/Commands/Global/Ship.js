const { EmbedBuilder } = require('discord.js');
const { loadImage, createCanvas } = require('canvas');
const path = require('path');

module.exports = {
    Name: 'ship',
    Aliases: ['shıp'],
    Description: 'İki kullanıcı arasındaki aşkı ölçer.',
    Usage: 'ship <@User/ID>',
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
        let targetUser = message.mentions.users.first() || await client.guilds.cache.get(message.guild.id).members.fetch(args[0]);

        if (!targetUser || message.author.id === targetUser?.id) {
            const manRoles = ertu?.settings?.manRoles;
            const womanRoles = ertu?.settings?.womanRoles;
            const unregisterRoles = ertu?.settings?.unregisterRoles;

            if (manRoles?.some(x => message.member.roles.cache.has(x))) {
                targetUser = message.guild.members.cache
                    .filter(m => m.id !== message.author.id &&
                        !unregisterRoles.some(x => m.roles.cache.get(x)) &&
                        womanRoles.some(x => m.roles.cache.get(x)))
                    .random();
            } else if (womanRoles?.some(x => message.member.roles.cache.has(x))) {
                targetUser = message.guild.members.cache
                    .filter(m => m.id !== message.author.id &&
                        !unregisterRoles.some(x => m.roles.cache.get(x)) &&
                        manRoles.some(x => m.roles.cache.get(x)))
                    .random();
            } else {
                targetUser = message.guild.members.cache.random();
            }
        }

        const percent = client.system.ownerID.includes(message.author.id) ? 100 : await random(5, 100);

        const canvas = createCanvas(691, 244);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#3c3c3c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#e31b23';
        ctx.fillRect(263, 194, 167, -((percent / 100) * 147));

        const backgroundImage = await loadImage(path.join(__dirname, '../../../../Global/Assets/Images/ship.jpg'));
        ctx.drawImage(backgroundImage, 0, 0);

        const authorAvatar = await loadImage(message.author.displayAvatarURL({ extension: 'png', size: 4096 }));
        const targetAvatar = await loadImage(targetUser.displayAvatarURL({ extension: 'png', size: 4096 }));
        ctx.drawImage(authorAvatar, 42, 38, 170, 170);
        ctx.drawImage(targetAvatar, 480, 38, 170, 170);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = 'normal 42px Kanit';
        ctx.fillText(`%${percent}`, 348, 130);

        const shipEmbed = new EmbedBuilder({
            color: client.getColor('random'),
            description: `[ ${message.author} ve ${targetUser} arasındaki uyum; ]`,
            image: { url: 'attachment://ship.png' },
            footer: { text: `%${percent} | ${createContent(percent)}` }
        })

        message.channel.send({
            embeds: [shipEmbed],
            files: [{ attachment: canvas.toBuffer(), name: 'ship.png' }]
        });
    },
};

function createContent(num) {
    if (num < 10) return 'Bizden olmaz...';
    if (num < 20) return 'Çok farklıyız...';
    if (num < 30) return 'Eksik bir şeyler var...';
    if (num < 40) return 'Sıradan biri gibi...';
    if (num < 50) return 'Aslında hoş biri...';
    if (num < 60) return 'Fena değil...';
    if (num < 70) return 'Bi kahveye ne dersin?';
    if (num < 80) return 'Çiğköfte & milkshake yapalım mı?';
    if (num < 90) return 'Beraber film izleyelim mi?';
    return 'Ev boş?';
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
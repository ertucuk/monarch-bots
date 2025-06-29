const { ButtonBuilder, ButtonStyle, ActionRowBuilder, time, Collection, inlineCode, ComponentType, EmbedBuilder, PermissionFlagsBits, bold } = require('discord.js');
const { UserModel, SettingsModel } = require('../Settings/Schemas/');
const limits = new Collection();
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs')
const os = require('os');
const axios = require('axios');
const OneDay = 1000 * 60 * 60 * 24;

module.exports = class Functions {

    inviteRegex = /\b(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discordapp\.com\/invite)\/([a-zA-Z0-9\-]{2,32})\b/;

    static getSnowflake(snowflake) {
        const match = snowflake?.match(/<@(\d+)>/)
        return match ? match[1] : snowflake;
    }

    static splitMessage(text, { maxLength = 2000, char = '\n', prepend = '', append = '' } = {}) {
        if (text.length <= maxLength) return [append + text + prepend];
        const splitText = text.split(char);
        const messages = [];
        let msg = '';
        for (const chunk of splitText) {
            if (msg && (msg + char + chunk + append).length > maxLength) {
                messages.push(msg + append);
                msg = prepend;
            }
            msg += (msg && msg !== prepend ? char : '') + chunk;
        }

        return messages.concat(msg).filter((m) => m);
    }

    static async speedTest(url) {
        return axios.get(url).then(async (response) => {
            const match = response.data.match(/window\.OOKLA\.INIT_DATA\s*=\s*(\{.*?\});/);
            if (!match) return null;
            const result = JSON.parse(match[1]).result;

            return {
                download: result.download ? String(result.download).slice(0, -3) : null,
                upload: result.upload ? String(result.upload).slice(0, -3) : null
            }

        }).catch((error) => {
            console.error(error);
            return null;
        });
    }

    static timesUp() {
        return new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    custom_id: 'timeEnded',
                    label: 'Süre Doldu.',
                    emoji: '⏱️',
                    style: ButtonStyle.Danger,
                    disabled: true,
                }),
            ],
        })
    }

    static checkLimit(key, id, type, count = 5, minutes = 1000 * 60 * 15) {
        const now = Date.now();

        const member = key.guild.members.cache.get(id);

        const userLimits = limits.get(`${id}-${type}`);
        if (!userLimits) {
            limits.set(`${id}-${type}`, { count: 1, lastUsage: now });
            return { hasLimit: false };
        }

        userLimits.count = userLimits.count + 1;
        const diff = now - userLimits.lastUsage;

        if (diff < minutes && userLimits.count >= count) {
            return {
                hasLimit: true,
                time: time(Math.floor((userLimits.lastUsage + minutes) / 1000), 'R'),
                delete: userLimits.lastUsage + minutes
            };
        }

        if (diff > minutes) limits.delete(id);
        else limits.set(id, userLimits);
        return { hasLimit: false };
    }

    static chunkArray(array, chunkSize) {
        const temp = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            temp.push(array.slice(i, i + chunkSize));
        }
        return temp;
    };

    static date(date) {
        return new Date(date).toLocaleString('tr-TR', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    static checkUser(message, member) {
        let type;

        if (member.user.bot) type = 'Botlara işlem yapamazsın!';
        if (client.system.ownerID.includes(member.id)) type = 'Sahibe işlem yapamazsın!';
        if (message.member?.roles.highest.id === member.roles.highest.id) type = `${member} ile aynı yetkidesin! Kullanıcıya işlem yapamazsın.`;
        if (member.roles.highest.rawPosition >= message.member?.roles.highest.rawPosition) type = `${member} senden daha üst bir yetkiye sahip.`;
        if (message.member.id === member.id) type = 'Kendinize işlem yapamazsın!';
        if (message.guild?.members.me?.roles.highest.id === member.roles.highest.id) type = `${member} benimle aynı yetkiye sahip! Kullanıcıya işlem yapamam.`;
        if (type) message.reply(type);
        return type;
    }

    static getImage(str) {
        const images = str.match(/((?:https?:\/\/)[a-z0-9]+(?:[-.][a-z0-9]+)*\.[a-z]{2,5}(?::[0-9]{1,5})?(?:\/[^ \n<>]*)\.(?:png|apng|jpg|gif))/g);
        return images ? images[0] : undefined;
    };

    static async addStat({ type, member, channel, message, value }) {
        const now = new Date();
        let document = await UserModel.findOne({ id: member.id })
        if (!document) {
            document = new UserModel({ id: member.id })
            await document.save();
        }

        const diff = now.valueOf() - document.lastDayTime;
        if (diff >= OneDay) {
            document.day += Math.floor(diff / OneDay);
            document.lastDayTime = now.setHours(0, 0, 0, 0);
            document.markModified('day lastDayTime');
        }

        if (type === 'message') {
            if (!document.messages) document.messages = {};
            if (!document.messages[document.day]) document.messages[document.day] = { total: 0 };

            const dayData = document.messages[document.day];
            dayData.total += 1;
            dayData[message.channel.id] = (dayData[message.channel.id] || 0) + 1;
            document.lastMessage = now
            document.markModified('messages');

            await document.save();
        }

        if (type === 'voice') {
            if (!document.voices) document.voices = {};
            if (!document.voices[document.day]) document.voices[document.day] = { total: 0 };

            const dayData = document.voices[document.day];
            dayData.total += value;
            dayData[channel.id] = (dayData[channel.id] || 0) + value;
            document.lastVoice = now;
            document.markModified('voices');

            await document.save();
        }

        if (type === 'stream') {
            if (!document.streams) document.streams = {};
            if (!document.streams[document.day]) document.streams[document.day] = { total: 0 };

            const dayData = document.streams[document.day];
            dayData.total += value;
            dayData[channel.id] = (dayData[channel.id] || 0) + value;
            document.markModified('streams');

            await document.save();
        }

        if (type === 'camera') {
            if (!document.cameras) document.cameras = {};
            if (!document.cameras[document.day]) document.cameras[document.day] = { total: 0 };

            const dayData = document.cameras[document.day];
            dayData.total += value;
            dayData[channel.id] = (dayData[channel.id] || 0) + value;
            document.markModified('cameras');

            await document.save();
        }
    }

    static getChannels(guild, document, days, day) {
        const channelStats = {};
        let total = 0;
        Object.keys(days)
            .filter((d) => day > document.day - Number(d))
            .forEach((d) =>
                Object.keys(days[d]).forEach((channelId) => {
                    const channel = guild.channels.cache.get(channelId);
                    if (!channel) return;

                    if (!channelStats[channelId]) channelStats[channelId] = 0;
                    channelStats[channelId] += days[d][channelId];
                    total += days[d][channelId];
                }),
            );

        return {
            channels: Object.keys(channelStats)
                .sort((a, b) => channelStats[b] - channelStats[a])
                .map((c) => ({ id: c, value: channelStats[c] }))
                .slice(0, 10),
            total,
        };
    };

    static getCategory(guild, document, days, day) {
        const channelStats = {};
        let total = 0;
        Object.keys(days)
            .filter((d) => day > document.day - Number(d))
            .forEach((d) =>
                Object.keys(days[d]).forEach((channelId) => {
                    const channel = guild.channels.cache.get(channelId);
                    if (!channel || !channel.parentId) return;

                    if (!channelStats[channel.parentId]) channelStats[channel.parentId] = 0;
                    channelStats[channel.parentId] += days[d][channel.id];
                    total += days[d][channel.id];
                }),
            );

        return {
            categories: Object.keys(channelStats)
                .sort((a, b) => channelStats[b] - channelStats[a])
                .map((c) => ({ id: c, value: channelStats[c] }))
                .slice(0, 10),
            total,
        };
    };

    static formatDurations(ms) {
        const seconds = Math.floor(ms / 1000) % 60;
        const minutes = Math.floor(ms / (1000 * 60)) % 60;
        const hours = Math.floor(ms / (1000 * 60 * 60));

        const parts = [];
        if (hours > 0) parts.push(`${hours} saat`);
        if (minutes > 0) parts.push(`${minutes} dakika`);
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds} saniye`);

        return parts.join(' ');
    }

    static shortNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(2) + 'Mr';
        } else if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        } else {
            return num.toString();
        }
    };

    static async getPageData(currentPage, guildMembers, type, dayCount = 0) {
        if (!dayCount || dayCount <= 0) {
            const totalQuery = type === 'invites' ? { $size: '$invites' } :
                type === 'staff' ? { $size: '$staffs' } :
                    type === 'register' ? { $size: '$records' } :
                        {
                            $reduce: {
                                input: { $objectToArray: `$${type}` },
                                initialValue: 0,
                                in: {
                                    $add: ['$$value', { $toDouble: '$$this.v.total' }]
                                }
                            }
                        };
            return await UserModel.aggregate([
                {
                    $project: {
                        id: '$id',
                        total: totalQuery
                    }
                },
                {
                    $match: {
                        id: { $in: guildMembers },
                        total: { $gt: 0 }
                    }
                },
                {
                    $sort: { total: -1 }
                },
                { $skip: (currentPage - 1) * 10 },
                { $limit: 10 }
            ]);
        }

        const users = await UserModel.find({ id: { $in: guildMembers } });
        const result = users.map(user => {
            let total = 0;
            if (['messages', 'voices', 'streams', 'cameras'].includes(type) && user[type]) {
                const lastDayTime = user.lastDayTime || new Date().setHours(0, 0, 0, 0);
                const currentTime = Date.now();
                const OneDay = 24 * 60 * 60 * 1000;

                if (currentTime - lastDayTime > (dayCount * OneDay)) return { id: user.id, total: 0 };

                const lastDay = user.day || 0;
                for (let i = 0; i < dayCount; i++) {
                    const dayKey = (lastDay - i).toString();
                    if (user[type][dayKey]) {
                        total += user[type][dayKey].total || 0;
                    }
                }
            } else if (type === 'invites') {
                total = user.invites.length;
            } else if (type === 'register') {
                total = user.records.length;
            } else if (type === 'staff') {
                total = user.staffs.length;
            }
            return { id: user.id, total };
        });

        const filtered = result.filter(x => x.total > 0).sort((a, b) => b.total - a.total);
        return filtered.slice((currentPage - 1) * 10, currentPage * 10);
    }

    static async pageEmbed(client, guild, type, datas, page, member, dayCount) {
        const specials = {
            1: '🏆',
            2: '🥈',
            3: '🥉'
        };

        const topTitle = {
            messages: 'Mesaj Sıralaması',
            voices: 'Ses Sıralaması',
            streams: 'Yayın Sıralaması',
            cameras: 'Kamera Sıralaması',
            invites: 'Davet Sıralaması',
            register: 'Kayıt Sıralaması',
            staff: 'Yetkili Sıralaması',
        };

        return new EmbedBuilder({
            color: client.getColor('random'),
            footer: { text: 'made by ertu ❤️' },
            title: `${topTitle[type]} ${dayCount ? `(${dayCount} Günlük)` : ''}`,
            thumbnail: {
                url: guild.iconURL({ size: 2048 }) || ''
            },

            description: datas.length > 0
                ? [
                    ...datas.map((data, index) => {
                        const user = guild.members.cache.get(data.id);
                        if (!user) return;
                        const valueString = ['messages', 'invites', 'register', 'staff'].includes(type) ? `${data.total || 0} ${type === 'messages' ? 'mesaj' : type === 'invites' ? 'davet' : type === 'register' ? 'kayıt' : 'yetkili'}` : client.functions.formatDurations(data.total);
                        return `${inlineCode(` ${specials[this.shortNumber(index + (page - 1) * 10 + 1)] || `${index + (page - 1) * 10 + 1}.`} `)} ${user || user.displayName} - ${valueString} ${user.id === member ? `${bold('(Ben)')}` : ''}`;
                    })
                ].join('\n')
                : 'Hiç veri bulunamadı.',
        })
    }

    static async pagination(client, message, type, id, dayCount = 0) {
        const guildMembers = message.guild.members.cache.filter((member) => !member.user.bot).map((member) => member.id);

        const totalQuery = type === 'invites' ? { $size: '$invites' } :
            type === 'staff' ? { $size: '$staffs' } :
                type === 'register' ? { $size: '$records' } :
                    {
                        $reduce: {
                            input: { $objectToArray: `$${type}` },
                            initialValue: 0,
                            in: {
                                $add: ['$$value', { $toDouble: '$$this.v.total' }]
                            }
                        }
                    };

        let validRecordsCount = 0;
        if (!dayCount || dayCount <= 0) {
            const matchStage = {
                id: { $in: guildMembers },
                total: { $gt: 0 }
            };
            validRecordsCount = await UserModel.aggregate([
                {
                    $project: {
                        id: '$id',
                        total: totalQuery
                    }
                },
                {
                    $match: matchStage
                },
                {
                    $count: 'total'
                }
            ]).then(result => result[0]?.total || 0);
        } else {
            const users = await UserModel.find({ id: { $in: guildMembers } });
            const result = users.map(user => {
                let total = 0;
                if (['messages', 'voices', 'streams', 'cameras'].includes(type) && user[type]) {
                    const lastDayTime = user.lastDayTime || new Date().setHours(0, 0, 0, 0);
                    const currentTime = Date.now();
                    const OneDay = 24 * 60 * 60 * 1000;

                    if (currentTime - lastDayTime > (dayCount * OneDay)) return { id: user.id, total: 0 };

                    const lastDay = user.day || 0;
                    for (let i = 0; i < dayCount; i++) {
                        const dayKey = (lastDay - i).toString();
                        if (user[type][dayKey]) {
                            total += user[type][dayKey].total || 0;
                        }
                    }
                } else if (type === 'invites') {
                    total = user.invites.length;
                } else if (type === 'register') {
                    total = user.records.length;
                } else if (type === 'staff') {
                    total = user.staffs.length;
                }
                return { id: user.id, total };
            });

            validRecordsCount = result.filter(x => x.total > 0).length;
        }

        const totalData = Math.ceil(validRecordsCount / 10);
        let page = 1;

        const initialData = await this.getPageData(page, guildMembers, type, dayCount);
        await message.edit({
            embeds: [await this.pageEmbed(client, message.guild, type, initialData, page, id, dayCount)],
            components: totalData > 1 ? [client.getButton(page, totalData || 1)] : []
        });

        const filter = (i) => i.user.id === id;
        const collector = await message.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 2,
            componentType: ComponentType.Button
        });

        collector.on('collect', async (i) => {
            await i.deferUpdate();

            if (i.customId === 'first') page = 1;
            if (i.customId === 'previous') page = Math.max(1, page - 1);
            if (i.customId === 'next') page = Math.min(totalData, page + 1);
            if (i.customId === 'last') page = totalData;

            const newData = await this.getPageData(page, guildMembers, type, dayCount);
            await message.edit({
                embeds: [await this.pageEmbed(client, message.guild, type, newData, page, id, dayCount)],
                components: [client.getButton(page, totalData || 1)]
            });
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'time') message.edit({
                embeds: [await this.pageEmbed(client, message.guild, type, initialData, page, id, dayCount)],
                components: [client.functions.timesUp()]
            });
        });
    }

    static control(item) {
        if (typeof item === 'string' && item.length > 0) {
            return true;
        };

        if (Array.isArray(item) && item.length) {
            return true;
        };

        if (typeof item === 'number' && item > 0) {
            return true;
        }

        return false;
    };

    static titleCase(str) {
        return str
            .split(' ')
            .map((arg) => arg.charAt(0).toLocaleUpperCase('tr-TR') + arg.slice(1))
            .join(' ');
    }

    static async createBar(client, current, required) {
        const percentage = Math.min((100 * current) / required, 100);
        const progress = Math.max(Math.round((percentage / 100) * 4), 0);

        const checkEmoji = async (name) => {
            const emoji = await client.getEmoji(name);
            return typeof emoji === 'object' && emoji?.toString() ? emoji.toString() : '';
        };

        let str = await checkEmoji(percentage > 0 ? 'Start' : 'EmptyStart');
        str += (await checkEmoji('Mid')).repeat(progress);
        str += (await checkEmoji('EmptyMid')).repeat(4 - progress);
        str += await checkEmoji(percentage === 100 ? 'End' : 'EmptyEnd');
        return str;
    }

    static getRandomColor() {
        const letters = '0123456789ABCDEF'.split('');
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    static updateBadges(taskName, badges, tasks, member) {
        if (!badges || badges.length === 0) {
            const newTasks = tasks.map((task) => ({
                name: task.task,
                required: Number(task.value),
                count: 0,
                completed: false
            }));

            return [{
                tasks: newTasks,
                badge: 1,
                completed: false,
                name: taskName,
                date: new Date().toISOString()
            }];
        }

        const lowestUncompletedBadge = badges.find(badge => badge.completed);
        if (!lowestUncompletedBadge) return;

        const updatedBadges = badges.map(badge => {
            if (badge.badge === lowestUncompletedBadge.badge) {
                const updatedTasks = tasks.map((task) => ({
                    name: task.task,
                    required: Number(task.value),
                    count: 0,
                    completed: false
                }));

                return {
                    tasks: updatedTasks,
                    badge: badge.badge + 1,
                    completed: false,
                    name: taskName,
                    date: new Date().toISOString()
                };
            }
            return badge;
        });

        return updatedBadges;
    }

    static formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    static async generateSecretRoomPanel() {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 3000, height: 1200 });

        const defaultEmojiURLs = {
            change: 'https://cdn.discordapp.com/emojis/1372193715048812666.webp',
            limit: 'https://cdn.discordapp.com/emojis/1279920708117331998.webp',
            lock: 'https://cdn.discordapp.com/emojis/1279921052872609864.webp',
            visible: 'https://cdn.discordapp.com/emojis/1279921134040645694.webp',
            member: 'https://cdn.discordapp.com/emojis/1374467744585613372.webp?size=40',
            list: 'https://cdn.discordapp.com/emojis/1372193713752899675.webp'
        };

        const html = `
        <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
            
            body {
                margin: 0;
                padding: 0;
                font-family: 'Poppins', sans-serif;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                color: #ffffff;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                overflow: hidden;
                min-height: 100vh;
            }
            
            .container {
                width: 2800px;
                background: rgba(26, 26, 46, 0.8);
                border-radius: 24px;
                box-shadow: 0 12px 50px 0 rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(10px);
                border: 3px solid rgba(255, 255, 255, 0.08);
                padding: 60px;
                position: relative;
                overflow: hidden;
            }
            
            .glow {
                position: absolute;
                border-radius: 50%;
                filter: blur(100px);
                z-index: 0;
                opacity: 0.6;
                animation: pulse 8s infinite alternate;
            }
            
            .glow-1 {
                top: -120px;
                right: -120px;
                width: 400px;
                height: 400px;
                background: rgba(64, 78, 237, 0.5);
                animation-delay: 0s;
            }
            
            .glow-2 {
                bottom: -120px;
                left: -120px;
                width: 450px;
                height: 450px;
                background: rgba(65, 184, 240, 0.5);
                animation-delay: 2s;
            }
            
            .glow-3 {
                top: 40%;
                left: 50%;
                width: 300px;
                height: 300px;
                background: rgba(246, 91, 211, 0.3);
                animation-delay: 4s;
            }
            
            @keyframes pulse {
                0% {
                    transform: scale(1);
                    opacity: 0.5;
                }
                50% {
                    transform: scale(1.2);
                    opacity: 0.7;
                }
                100% {
                    transform: scale(1);
                    opacity: 0.5;
                }
            }
            
            .header {
                text-align: center;
                margin-bottom: 40px;
                position: relative;
                z-index: 2;
            }
            
            .title-box {
                display: inline-block;
                padding: 20px 40px;
                border-radius: 16px;
                background: rgba(0, 0, 0, 0.3);
                position: relative;
                border: 2px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                overflow: hidden;
            }
            
            .title-box::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 5px;
                background: linear-gradient(90deg, #404eed 0%, #41b8f0 100%);
                border-radius: 5px 5px 0 0;
            }
    
            .madeby {
                position: absolute;
                top: 32px;
                right: 60px;
                font-size: 55px;
                color: #41b8f0;
                font-weight: 700;
                z-index: 10;
                opacity: 0.7;
                letter-spacing: 1px;
                user-select: none;
            }
    
            .option-icon img {
                width: 300%;
                height: 300%;
                object-fit: contain;
                filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3));
                transition: all 0.4s ease;
            }
            
            h1 {
                font-size: 100px;
                margin: 0;
                background: linear-gradient(90deg, #404eed 0%, #41b8f0 100%);
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 700;
                letter-spacing: 2px;
                position: relative;
                z-index: 2;
                text-transform: uppercase;
            }
            
            .content {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 20px;
                padding: 20px 50px 30px 50px; /* TOP padding reduced from 50px to 20px, bottom 30px */
                position: relative;
                z-index: 2;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                border: 3px solid rgba(255, 255, 255, 0.05);
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
            }
            
            .info {
                margin-bottom: 35px; /* Reduced from 55px */
                color: #d1d5db;
                font-size: 75px;
                line-height: 1.6;
                font-weight: 400;
            }
            
            .info-title {
                font-size: 80px;
                font-weight: 600;
                margin-bottom: 20px;
                color: #ffffff;
                border-left: 20px solid #404eed;
                padding-left: 30px;
            }
            
            .features {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 45px;
                margin-bottom: 0px;
            }
            
            .feature {
                background: rgba(64, 78, 237, 0.1);
                border-radius: 18px;
                padding: 40px;
                border: 3px solid rgba(64, 78, 237, 0.3);
                transition: all 0.3s ease;
            }
            
            .feature:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(64, 78, 237, 0.2);
            }
            
            .feature-title {
                font-size: 65px;
                font-weight: 600;
                margin-bottom: 20px;
                color: #41b8f0;
                gap: 100px;
                display: flex;
                line-height: 1;
                align-items: center;
            }
            
            .feature-icon {
                margin-right: 20px;
                width: 60px;
                height: 60px;
                background: rgba(64, 78, 237, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 50px;
                color: #41b8f0;
            }
            
            .feature-description {
                color: #d1d5db;
                font-size: 50px;
                line-height: 1.5;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="glow glow-1"></div>
            <div class="glow glow-2"></div>
            <div class="glow glow-3"></div>
            
            <div class="header">
                <div class="title-box">
                    <h1>Özel Oda Sistemi</h1>
                </div>
            </div>
            
            <div class="content">
                <div class="info">
                    <div class="info-title">Özel Oda Sistemi Nedir?</div>
                    <p>
                        Sunucumuzda artık kendinize ait özel bir ses odası oluşturabilirsiniz! Bu yeni özellik ile sesli sohbet deneyiminizi tamamen kişiselleştirebilirsiniz.
                    </p>
                </div>
                
                <div class="features">
                    <div class="feature">
                        <div class="feature-title">
                            <div class="option-icon">
                                <img src="${defaultEmojiURLs.change}" alt="Change" />
                            </div>
                            Oda İsim Ayarla
                        </div>
                        <div class="feature-description">
                            Odanı kişiselleştirecek benzersiz bir isim seç.
                        </div>
                    </div>
                    <div class="feature">
                        <div class="feature-title">
                            <div class="option-icon">
                                <img src="${defaultEmojiURLs.limit}" alt="Limit" />
                            </div>
                            Oda Limit Ayarla
                        </div>
                        <div class="feature-description">
                            Odaya maksimum kaç kişinin girebileceğini belirle.
                        </div>
                    </div>
        
                    <div class="feature">
                        <div class="feature-title">
                            <div class="option-icon">
                                <img src="${defaultEmojiURLs.lock}" alt="Lock" />
                            </div>
                            Odayı Kilitle / Aç
                        </div>
                        <div class="feature-description">
                            İstediğinde kilitle veya herkese aç.
                        </div>
                    </div>
    
                     <div class="feature">
                        <div class="feature-title">
                           <div class="option-icon">
                                <img src="${defaultEmojiURLs.visible}" alt="Visible" />
                            </div>
                            Odayı Gizle / Herkese Göster
                        </div>
                        <div class="feature-description">
                            İstediğinde kilitle veya herkese aç.
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-title">
                            <div class="option-icon">
                                <img src="${defaultEmojiURLs.member}" alt="Member" />
                            </div>
                            Kullanıcı Ekle / Çıkar
                        </div>
                        <div class="feature-description">
                            Arkadaşlarını davet et veya uzaklaştır.
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-title">
                            <div class="option-icon">
                                <img src="${defaultEmojiURLs.list}" alt="List" />
                            </div>
                            Oda Listesi
                        </div>
                        <div class="feature-description">
                            Odan hakkında bilgi al.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
                `;

        await page.setContent(html);

        const buffer = await page.screenshot({
            type: 'png',
            fullPage: true,
            encoding: 'binary'
        });

        await browser.close();
        return buffer;
    }

    static async generateLocaPanel() {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 3000, height: 2750 });

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                    
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Poppins', sans-serif;
                        background: linear-gradient(135deg, #1a1a2e, #16213e);
                        color: #ffffff;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        overflow: hidden;
                    }
                    
                    .container {
                        width: 2800px;
                        background: rgba(26, 26, 46, 0.8);
                        border-radius: 24px;
                        box-shadow: 0 12px 50px 0 rgba(0, 0, 0, 0.5);
                        backdrop-filter: blur(10px);
                        border: 3px solid rgba(255, 255, 255, 0.08);
                        padding: 60px;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .glow {
                        position: absolute;
                        border-radius: 50%;
                        filter: blur(100px);
                        z-index: 0;
                        opacity: 0.6;
                        animation: pulse 8s infinite alternate;
                    }
                    
                    .glow-1 {
                        top: -120px;
                        right: -120px;
                        width: 400px;
                        height: 400px;
                        background: rgba(64, 78, 237, 0.5);
                        animation-delay: 0s;
                    }
                    
                    .glow-2 {
                        bottom: -120px;
                        left: -120px;
                        width: 450px;
                        height: 450px;
                        background: rgba(65, 184, 240, 0.5);
                        animation-delay: 2s;
                    }
                    
                    .glow-3 {
                        top: 40%;
                        left: 50%;
                        width: 300px;
                        height: 300px;
                        background: rgba(246, 91, 211, 0.3);
                        animation-delay: 4s;
                    }
                    
                    @keyframes pulse {
                        0% {
                            transform: scale(1);
                            opacity: 0.5;
                        }
                        50% {
                            transform: scale(1.2);
                            opacity: 0.7;
                        }
                        100% {
                            transform: scale(1);
                            opacity: 0.5;
                        }
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        position: relative;
                        z-index: 2;
                    }
                    
                    .title-box {
                        display: inline-block;
                        padding: 20px 40px;
                        border-radius: 16px;
                        background: rgba(0, 0, 0, 0.3);
                        position: relative;
                        border: 2px solid rgba(255, 255, 255, 0.1);
                        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                        overflow: hidden;
                    }
                    
                    .title-box::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 5px;
                        background: linear-gradient(90deg, #404eed 0%, #41b8f0 100%);
                        border-radius: 5px 5px 0 0;
                    }
                    
                    h1 {
                        font-size: 100px;
                        margin: 0;
                        background: linear-gradient(90deg, #404eed 0%, #41b8f0 100%);
                        -webkit-background-clip: text;
                        background-clip: text;
                        -webkit-text-fill-color: transparent;
                        font-weight: 700;
                        letter-spacing: 2px;
                        position: relative;
                        z-index: 2;
                        text-transform: uppercase;
                    }
                    
                    .content {
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 20px;
                        padding: 50px;
                        position: relative;
                        z-index: 2;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                        border: 3px solid rgba(255, 255, 255, 0.05);
                    }
                    
                    .info {
                        margin-bottom: 55px;
                        color: #d1d5db;
                        font-size: 40px;
                        line-height: 1.6;
                        font-weight: 400;
                    }
                    
                    .info-title {
                        font-size: 55px;
                        font-weight: 600;
                        margin-bottom: 20px;
                        color: #ffffff;
                        border-left: 10px solid #404eed;
                        padding-left: 20px;
                    }
                    
                    .features {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 45px;
                        margin-bottom: 55px;
                    }
                    
                    .feature {
                        background: rgba(64, 78, 237, 0.1);
                        border-radius: 18px;
                        padding: 40px;
                        border: 3px solid rgba(64, 78, 237, 0.3);
                        transition: all 0.3s ease;
                    }
                    
                    .feature:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 25px rgba(64, 78, 237, 0.2);
                    }
                    
                    .feature-title {
                        font-size: 60px;
                        font-weight: 600;
                        margin-bottom: 20px;
                        color: #41b8f0;
                        display: flex;
                        align-items: center;
                    }
                    
                    .feature-icon {
                        margin-right: 20px;
                        width: 50px;
                        height: 50px;
                        background: rgba(64, 78, 237, 0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 45px;
                        color: #41b8f0;
                    }
                    
                    .feature-description {
                        color: #d1d5db;
                        font-size: 45px;
                        line-height: 1.5;
                    }
                    
                    .pricing {
                        margin-top: 60px;
                    }
                    
                    .pricing-title {
                        font-size: 65px;
                        font-weight: 600;
                        margin-bottom: 25px;
                        color: #ffffff;
                        border-left: 10px solid #404eed;
                        padding-left: 20px;
                    }
                    
                    .pricing-cards {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 45px;
                    }
                    
                    .pricing-card {
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 18px;
                        padding: 45px;
                        text-align: center;
                        border: 3px solid rgba(255, 255, 255, 0.05);
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .pricing-card::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 6px;
                        background: linear-gradient(90deg, #404eed 0%, #41b8f0 100%);
                    }
                    
                    .pricing-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
                        border-color: rgba(64, 78, 237, 0.3);
                    }
                    
                    .pricing-duration {
                        font-size: 46px;
                        font-weight: 700;
                        margin-bottom: 20px;
                        color: #ffffff;
                    }
                    
                    .pricing-price {
                        font-size: 56px;
                        font-weight: 700;
                        margin-bottom: 25px;
                        color: #41b8f0;
                    }
                    
                    .pricing-coin {
                        font-size: 44px;
                        color: #f3ba2f;
                    }
                    
                    .pricing-card p {
                        font-size: 36px;
                    }
                    
                    .highlight {
                        color: #41b8f0;
                        font-weight: 500;
                    }
                    
                    .note {
                        margin-top: 55px;
                        padding: 40px;
                        background: rgba(246, 91, 211, 0.1);
                        border-radius: 18px;
                        border-left: 10px solid #f65bd3;
                    }
                    
                    .note-title {
                        font-size: 55px;
                        font-weight: 600;
                        margin-bottom: 15px;
                        color: #f65bd3;
                    }
                    
                    .note-content {
                        color: #d1d5db;
                        font-size: 40px;
                        line-height: 1.5;
                    }
                    
                    .how-to-earn {
                        margin-top: 55px;
                    }
                    
                    .footer {
                        text-align: center;
                        margin-top: 50px;
                        font-size: 36px;
                        font-weight: 500;
                        letter-spacing: 1px;
                        position: relative;
                        z-index: 2;
                        padding: 25px 40px;
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 40px;
                        display: inline-block;
                        left: 50%;
                        transform: translateX(-50%);
                        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
                    }
                    
                    .footer span {
                        background: linear-gradient(90deg, #404eed, #41b8f0);
                        -webkit-background-clip: text;
                        background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                    
                    .button-hint {
                        text-align: center;
                        margin-top: 35px;
                        font-size: 34px;
                        color: #9ca3af;
                        position: relative;
                        z-index: 2;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="glow glow-1"></div>
                    <div class="glow glow-2"></div>
                    <div class="glow glow-3"></div>
                    
                    <div class="header">
                        <div class="title-box">
                            <h1>Özel Loca Sistemi</h1>
                        </div>
                    </div>
                    
                    <div class="content">
                        <div class="info">
                            <div class="info-title">Özel Loca Sistemi Nedir?</div>
                            <p>
                                Kendine özel bir alan oluşturabilir ve tamamen kontrolü ele alabilirsin! Odanda neler olacağına sadece sen karar verirsin. Üstelik, merak etme, sen izin vermediğin sürece bu alana <span class="highlight">kurucular</span> bile giremiyor. 🔐
                            </p>
                        </div>
                        
                        <div class="features">
                            <div class="feature">
                                <div class="feature-title">
                                    <div class="feature-icon">🔨</div>
                                    Loca Oluştur
                                </div>
                                <div class="feature-description">
                                    Hemen kendine özel bir Loca oluştur ve kişiselleştir!
                                </div>
                            </div>
                            
                            <div class="feature">
                                <div class="feature-title">
                                    <div class="feature-icon">👥</div>
                                    Loca Limit Ayarla
                                </div>
                                <div class="feature-description">
                                    Locaya maksimum kaç kişinin girebileceğini belirle.
                                </div>
                            </div>
                            
                            <div class="feature">
                                <div class="feature-title">
                                    <div class="feature-icon">✏️</div>
                                    Loca İsim Ayarla
                                </div>
                                <div class="feature-description">
                                    Locanı kişiselleştirecek benzersiz bir isim seç.
                                </div>
                            </div>
                            
                            <div class="feature">
                                <div class="feature-title">
                                    <div class="feature-icon">🔒</div>
                                    Locayı Kilitle / Herkese Aç
                                </div>
                                <div class="feature-description">
                                    İstediğinde kilitle veya herkese aç.
                                </div>
                            </div>
                            
                            <div class="feature">
                                <div class="feature-title">
                                    <div class="feature-icon">➕</div>
                                    Kullanıcı Ekle
                                </div>
                                <div class="feature-description">
                                    Locana istediğin arkadaşlarını davet et.
                                </div>
                            </div>
                            
                            <div class="feature">
                                <div class="feature-title">
                                    <div class="feature-icon">➖</div>
                                    Kullanıcı Çıkar
                                </div>
                                <div class="feature-description">
                                    İstemediğin kullanıcıları locandan uzaklaştır.
                                </div>
                            </div>
                        </div>
                        
                        <div class="pricing">
                            <div class="pricing-title">Özel Loca Paketleri</div>
                            
                            <div class="pricing-cards">
                                <div class="pricing-card">
                                    <div class="pricing-duration">1 Günlük</div>
                                    <div class="pricing-price">1000 <span class="pricing-coin">💰</span></div>
                                    <p>Kısa süreli etkinlikler için ideal</p>
                                </div>
                                
                                <div class="pricing-card">
                                    <div class="pricing-duration">7 Günlük</div>
                                    <div class="pricing-price">5000 <span class="pricing-coin">💰</span></div>
                                    <p>Uzun sohbetler ve projeler için</p>
                                </div>
                                
                                <div class="pricing-card">
                                    <div class="pricing-duration">30 Günlük</div>
                                    <div class="pricing-price">15000 <span class="pricing-coin">💰</span></div>
                                    <p>Sürekli gruplar ve topluluklar için</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="how-to-earn">
                            <div class="info-title">Coin Nasıl Kazanılır?</div>
                            <div class="note-content">
                                Sunucumuzda aktif olarak vakit geçirerek veya etkinliklere katılarak <span class="highlight">Coin</span> biriktirebilirsin. Ayrıca, daha fazla bilgi almak için aşağıdaki <span class="highlight">Coin Tablosu</span> butonuna göz atabilirsin.
                             </div>
                        </div>
                        
                        <div class="note">
                            <div class="note-title">Önemli Hatırlatma</div>
                            <div class="note-content">
                                Herhangi bir sorunun olursa veya daha fazla bilgiye ihtiyacın varsa, bize her zaman ulaşabilirsin! İyi eğlenceler!
                            </div>
                        </div>
                    </div>
            </body>
            </html>
            `;

        await page.setContent(html);

        const buffer = await page.screenshot({
            type: 'png',
            fullPage: true,
            encoding: 'binary'
        });

        await browser.close();
        return buffer;
    }

    static async generateStreamerAppealPanel() {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 1000 });

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                    
                      body {
                margin: 0;
                padding: 0;
                font-family: 'Poppins', sans-serif;
                background: linear-gradient(135deg, #111827, #1f2937);
                color: #ffffff;
                width: 100vw;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
            }
                    
                    .container {
                width: 90vw;
                height: 90vh;
                background: rgba(17, 24, 39, 0.8);
                border-radius: 16px;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                padding: 25px;
                position: relative;
                overflow: hidden;
            }
                    .glow {
                        position: absolute;
                        border-radius: 50%;
                        filter: blur(80px);
                        z-index: 0;
                        opacity: 0.6;
                        animation: pulse 8s infinite alternate;
                    }
                    
                    .glow-1 {
                        top: -100px;
                        right: -100px;
                        width: 300px;
                        height: 300px;
                        background: rgba(127, 29, 246, 0.5);
                        animation-delay: 0s;
                    }
                    
                    .glow-2 {
                        bottom: -100px;
                        left: -100px;
                        width: 350px;
                        height: 350px;
                        background: rgba(56, 189, 248, 0.5);
                        animation-delay: 2s;
                    }
                    
                    .glow-3 {
                        top: 40%;
                        left: 50%;
                        width: 200px;
                        height: 200px;
                        background: rgba(239, 68, 68, 0.3);
                        animation-delay: 4s;
                    }
                    
                    @keyframes pulse {
                        0% {
                            transform: scale(1);
                            opacity: 0.5;
                        }
                        50% {
                            transform: scale(1.2);
                            opacity: 0.7;
                        }
                        100% {
                            transform: scale(1);
                            opacity: 0.5;
                        }
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 25px;
                        position: relative;
                        z-index: 2;
                    }
                    
                    .title-box {
                        display: inline-block;
                        padding: 15px 30px;
                        border-radius: 10px;
                        background: rgba(0, 0, 0, 0.3);
                        position: relative;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                        overflow: hidden;
                    }
                    
                    .title-box::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 3px;
                        background: linear-gradient(90deg, #7f1df6 0%, #38bdf8 100%);
                        border-radius: 3px 3px 0 0;
                    }
                    
                    h1 {
                        font-size: 48px;
                        margin: 0;
                        background: linear-gradient(90deg, #7f1df6 0%, #38bdf8 100%);
                        -webkit-background-clip: text;
                        background-clip: text;
                        -webkit-text-fill-color: transparent;
                        font-weight: 700;
                        letter-spacing: 1px;
                        position: relative;
                        z-index: 2;
                        text-transform: uppercase;
                    }
                    
                    .live-indicator {
                        display: inline-block;
                        width: 12px;
                        height: 12px;
                        background-color: #ef4444;
                        border-radius: 50%;
                        margin-right: 8px;
                        animation: blink 1.5s infinite;
                        vertical-align: middle;
                        position: relative;
                        top: -2px;
                    }
                    
                    @keyframes blink {
                        0% { opacity: 1; }
                        50% { opacity: 0.3; }
                        100% { opacity: 1; }
                    }
                    
                    .content {
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 12px;
                        padding: 25px;
                        position: relative;
                        z-index: 2;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                    }
                    
                    .info {
                        margin-bottom: 30px;
                        color: #d1d5db;
                        font-size: 25px;
                        line-height: 1.6;
                        font-weight: 400;
                    }
                    
                    .steps {
                        counter-reset: steps;
                    }
                    
                    .step {
                        display: flex;
                        margin-bottom: 25px;
                        position: relative;
                        padding-left: 60px;
                        counter-increment: steps;
                    }
                    
                    .step:last-child {
                        margin-bottom: 0;
                    }
                    
                    .step::before {
                        content: counter(steps);
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 45px;
                        height: 45px;
                        background: linear-gradient(135deg, #7f1df6, #38bdf8);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 20px;
                        box-shadow: 0 3px 10px rgba(127, 29, 246, 0.4);
                        z-index: 2;
                    }
                    
                    .step::after {
                        content: '';
                        position: absolute;
                        left: 22px;
                        top: 45px;
                        width: 2px;
                        height: calc(100% - 5px);
                        background: linear-gradient(to bottom, #7f1df6, rgba(56, 189, 248, 0.3));
                        z-index: 1;
                    }
                    
                    .step:last-child::after {
                        display: none;
                    }
                    
                    .step-content {
                        flex: 1;
                        background: rgba(31, 41, 55, 0.5);
                        border-radius: 10px;
                        padding: 15px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        transition: all 0.3s ease;
                    }
                    
                    .step-content:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
                        border-color: rgba(127, 29, 246, 0.3);
                    }
                    
                    .step-title {
                        font-size: 25px;
                        font-weight: 600;
                        margin-bottom: 8px;
                        color: #f3f4f6;
                        display: flex;
                        align-items: center;
                    }
                    
                    .step-icon {
                        margin-right: 10px;
                        font-size: 20px;
                        color: #38bdf8;
                    }
                    
                    .step-description {
                        color: #d1d5db;
                        font-size: 24px;
                        line-height: 1.5;
                    }
                    
                    .highlight {
                        color: #38bdf8;
                        font-weight: 500;
                    }
                    
                    .link {
                        color: #7f1df6;
                        text-decoration: none;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        position: relative;
                        padding-bottom: 2px;
                    }
                    
                    .link::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                        height: 1px;
                        background: linear-gradient(90deg, #7f1df6, #38bdf8);
                        transform: scaleX(0);
                        transform-origin: right;
                        transition: transform 0.3s ease;
                    }
                    
                    .link:hover::after {
                        transform: scaleX(1);
                        transform-origin: left;
                    }
                    
                    .footer {
                        text-align: center;
                        margin-top: 25px;
                        font-size: 14px;
                        font-weight: 500;
                        letter-spacing: 1px;
                        position: relative;
                        z-index: 2;
                        padding: 12px 20px;
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 30px;
                        display: inline-block;
                        left: 50%;
                        transform: translateX(-50%);
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                    }
                    
                    .footer span {
                        background: linear-gradient(90deg, #7f1df6, #38bdf8);
                        -webkit-background-clip: text;
                        background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                    
                    .particles {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                        z-index: 0;
                    }
                    
                    .particle {
                        position: absolute;
                        width: 2px;
                        height: 2px;
                        background-color: rgba(255, 255, 255, 0.5);
                        border-radius: 50%;
                    }
                    
                    .button-hint {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 14px;
                        color: #9ca3af;
                        position: relative;
                        z-index: 2;
                    }
                    
                    .arrow-down {
                        display: block;
                        margin: 8px auto;
                        width: 24px;
                        height: 24px;
                        border-right: 3px solid #7f1df6;
                        border-bottom: 3px solid #38bdf8;
                        transform: rotate(45deg);
                        animation: bounce 2s infinite;
                    }
                    
                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% {
                            transform: translateY(0) rotate(45deg);
                        }
                        40% {
                            transform: translateY(-10px) rotate(45deg);
                        }
                        60% {
                            transform: translateY(-5px) rotate(45deg);
                        }
                    }
                </style>
            </head>
            <body>
                <div class="particles"></div>
                
                <div class="container">
                    <div class="glow glow-1"></div>
                    <div class="glow glow-2"></div>
                    <div class="glow glow-3"></div>
                    
                    <div class="header">
                        <div class="title-box">
                            <h1>Streamer Başvuru</h1>
                        </div>
                    </div>
                    
                    <div class="content">
                        <div class="info">
                            Aşağıdaki adımları takip ederek başvurunuzu yapabilirsiniz. Bir sorun yaşamanız durumunda sunucu yetkililerine konu hakkında bilgi veriniz.
                        </div>
                        
                        <div class="steps">
                            <div class="step">
                                <div class="step-content">
                                    <div class="step-title">
                                        <span class="step-icon">🌐</span>
                                        Hız Testi Yapın
                                    </div>
                                    <div class="step-description">
                                        İlk olarak <a href="https://www.speedtest.net" target="_blank" class="link">Speedtest</a> sitesine gidip bir hız testi yapın. Sonuçlarınızı kaydedin veya ekran görüntüsünü alın.
                                    </div>
                                </div>
                            </div>
                            
                            <div class="step">
                                <div class="step-content">
                                    <div class="step-title">
                                        <span class="step-icon">👆</span>
                                        Başvuru Yapın
                                    </div>
                                    <div class="step-description">
                                        Hız testinizi tamamladıktan sonra aşağıdaki <span class="highlight">Başvuru Yap</span> butonuna tıklayın.
                                    </div>
                                </div>
                            </div>
                            
                            <div class="step">
                                <div class="step-content">
                                    <div class="step-title">
                                        <span class="step-icon">📝</span>
                                        Formu Doldurun
                                    </div>
                                    <div class="step-description">
                                        Açılan forma hız testi linkinizi yapıştırın ve <span class="highlight">Gönder</span> butonuna tıklayın.
                                    </div>
                                </div>
                            </div>
                            
                            <div class="step">
                                <div class="step-content">
                                    <div class="step-title">
                                        <span class="step-icon">✅</span>
                                        Rolünüzü Alın
                                    </div>
                                    <div class="step-description">
                                        Başvurunuz alındıktan sonra gereken şartları sağlamanız durumunda otomatik olarak <span class="highlight">Streamer</span> rolü verilecektir.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
    
                </div>
                
            </body>
            </html>
            `;

        await page.setContent(html);
        const buffer = await page.screenshot({
            type: 'png',
            fullPage: true,
            encoding: 'binary'
        });

        await browser.close();
        return buffer;
    }

    static async generateStreamerPanel(client) {
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1000, height: 800 });

        const defaultArrowEmoji = 'https://cdn.discordapp.com/emojis/992772326947037215.webp?size=80';
        const serverName = client.guilds.cache.first()?.name || 'ertu';

        const features = [
            {
                title: 'Oda Bilgisi',
                description: 'Bulunduğunuz oda hakkında bilgi alın.'
            },
            {
                title: 'Oda Sahipliğini Aktar',
                description: 'Odanızın sahipliğini başka bir kullanıcıya devredin.'
            },
            {
                title: 'Odaya İzin Ekle/Çıkar',
                description: 'İstediğiniz kullanıcıya yayın açma/kapama izni verin.'
            }
        ];

        const html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Streamer Panel</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    
          body {
            margin: 0;
            padding: 0;
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
            color: #ffffff;
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }
    
          .container {
            width: 90vw;
            height: 90vh;
            background: rgba(15, 14, 40, 0.8);
            border-radius: 20px;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 25px;
            position: relative;
            overflow: hidden;
            z-index: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
          }
    
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
    
          h1 {
            font-size: 3.5rem;
            margin: 0;
            background: linear-gradient(90deg, #7B61FF, #FF2975);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 700;
            letter-spacing: 1px;
          }
    
          .welcome {
            font-size: 1.75rem;
            margin: 15px 0;
          }
    
          .server-name {
            color: #7B61FF;
            font-weight: 600;
          }
    
          .description {
            font-size: 1.25rem;
            color: #c5c5c5;
            line-height: 1.6;
            margin-bottom: 25px;
            text-align: center;
            max-width: 80%;
          }
    
          .features {
            width: 100%;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
    
          .feature {
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            padding: 15px;
            margin: 10px auto;
            width: 80%;
            border-left: 4px solid rgba(123, 97, 255, 0.5);
            transition: transform 0.3s ease, border-color 0.3s ease;
          }
    
          .feature:hover {
            transform: translateX(5px);
            border-color: #7B61FF;
          }
    
          .feature-icon img {
            width: 2rem;
            height: 2rem;
            margin-right: 1rem;
          }
    
          .feature-text {
            flex: 1;
          }
    
          .feature-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 4px;
          }
    
          .feature-desc {
            font-size: 1.155rem;
            color: #b8b8b8;
          }
    
          .footer {
            font-size: 1.125rem;
            text-align: center;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Yayıncı Odası Düzenleme Paneli</h1>
          </div>
          <div class="welcome">Merhaba, <span class="server-name">${serverName}</span> yayıncı paneline hoşgeldiniz.</div>
          <div class="description">
            Sunucumuzda bulunan <strong>Yayıncı Odaları</strong> için düzenleme yapmak istiyorsanız, aşağıdaki seçeneklerden birini seçin.
          </div>
          <div class="features">
            ${features.map(
            feature => `
                <div class="feature">
                  <div class="feature-icon"><img src="${defaultArrowEmoji}" alt="arrow" /></div>
                  <div class="feature-text">
                    <div class="feature-title">${feature.title}</div>
                    <div class="feature-desc">${feature.description}</div>
                  </div>
                </div>
              `
        ).join('')}
          </div>
        </div>
      </body>
      </html>
    `;

        await page.setContent(html);
        await new Promise(res => setTimeout(res, 500));
        const buffer = await page.screenshot({ type: 'png', fullPage: true, encoding: 'binary' });
        await browser.close();
        return buffer;
    }

    static async generateSpotifyCard(member, message, progress, albumArt, songName, artistName, albumName, currentTime, totalTime) {
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Gotham:wght@400;500;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Gotham', 'Montserrat', sans-serif;
                    background-color: transparent;
                    overflow: hidden;
                }
                
                .spotify-card {
                    width: 600px;
                    height: 220px;
                    background: #121212;
                    border-radius: 16px;
                    display: flex;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    position: relative;
                }
                
                .card-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(45deg, rgba(18, 18, 18, 0.6) 0%, rgba(18, 18, 18, 0.9) 100%);
                    z-index: 1;
                }
                
                .album-art-container {
                    position: relative;
                    z-index: 2;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                }
                
                .album-art {
                    width: 180px;
                    height: 180px;
                    background-size: cover;
                    background-position: center;
                    border-radius: 8px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
                    position: relative;
                    overflow: hidden;
                }
                
                .album-art::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%);
                    pointer-events: none;
                }
                
                .song-details {
                    flex: 1;
                    padding: 20px 25px;
                    color: white;
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                
                .now-playing {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #1DB954;
                    margin-bottom: 8px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                }
                
                .now-playing::before {
                    content: '';
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    background-color: #1DB954;
                    border-radius: 50%;
                    margin-right: 6px;
                    animation: pulse 1.5s infinite;
                }
                
                @keyframes pulse {
                    0% { opacity: 0.6; transform: scale(0.9); }
                    50% { opacity: 1; transform: scale(1.1); }
                    100% { opacity: 0.6; transform: scale(0.9); }
                }
                
                .song-title {
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: 1.2;
                    color: #FFFFFF;
                }
                
                .artist-name {
                    font-size: 18px;
                    margin: 8px 0 0;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    color: #B3B3B3;
                }
                
                .album-name {
                    font-size: 14px;
                    color: #B3B3B3;
                    opacity: 0.8;
                    margin: 6px 0 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .player-controls {
                    margin-top: 22px;
                }
                
                .progress-container {
                    width: 100%;
                    height: 4px;
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 50px;
                    margin-top: 15px;
                    overflow: hidden;
                }
                
                .progress-bar {
                    height: 100%;
                    background-color: #1DB954;
                    border-radius: 50px;
                    width: ${progress}%;
                    position: relative;
                }
                
                .progress-bar::after {
                    content: '';
                    position: absolute;
                    right: -5px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 10px;
                    height: 10px;
                    background-color: white;
                    border-radius: 50%;
                    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
                    display: ${progress > 2 ? 'block' : 'none'};
                }
                
                .time-details {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    margin-top: 8px;
                    color: #B3B3B3;
                    font-weight: 500;
                }
                
                .spotify-logo {
                    position: absolute;
                    bottom: 16px;
                    left: 20px;
                    width: 20px;
                    height: 20px;
                    z-index: 3;
                    opacity: 0.7;
                }
                
                .user-info {
                    position: absolute;
                    top: 16px;
                    right: 20px;
                    font-size: 12px;
                    color: #B3B3B3;
                    z-index: 3;
                    background-color: rgba(0, 0, 0, 0.3);
                    padding: 4px 10px;
                    border-radius: 50px;
                    backdrop-filter: blur(5px);
                }
                
                .user-info-icon {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    background-color: #1DB954;
                    border-radius: 50%;
                    margin-right: 6px;
                    vertical-align: middle;
                    position: relative;
                    top: -1px;
                }
            </style>
        </head>
        <body>
            <div class="spotify-card">
                <div class="card-bg" style="background-image: url('${albumArt}'); background-size: cover; background-position: center; filter: blur(30px); opacity: 0.4;"></div>
                <div class="album-art-container">
                    <div class="album-art" style="background-image: url('${albumArt}')"></div>
                </div>
                <div class="song-details">
                    <div class="now-playing">Şu anda çalıyor</div>
                    <h1 class="song-title">${songName}</h1>
                    <p class="artist-name">${artistName}</p>
                    <p class="album-name">${albumName}</p>
                    
                    <div class="player-controls">
                        <div class="progress-container">
                            <div class="progress-bar"></div>
                        </div>
                        <div class="time-details">
                            <span>${currentTime}</span>
                            <span>${totalTime}</span>
                        </div>
                    </div>
                  
                </div>
            </div>
        </body>
        </html>
        `;

        const tempDir = os.tmpdir();
        const htmlPath = path.join(tempDir, `spotify-${message.author.id}.html`);
        const screenshotPath = path.join(tempDir, `spotify-${message.author.id}.png`);

        fs.writeFileSync(htmlPath, htmlTemplate);

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
            defaultViewport: {
                width: 600,
                height: 220,
                deviceScaleFactor: 2
            }
        });
        const page = await browser.newPage();
        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
        await page.setViewport({ width: 600, height: 220 });
        await page.screenshot({
            path: screenshotPath,
            omitBackground: true,
            clip: {
                x: 0,
                y: 0,
                width: 600,
                height: 220
            }
        });
        await browser.close();

        setTimeout(() => {
            fs.unlinkSync(htmlPath);
            fs.unlinkSync(screenshotPath);
        }, 5000);

        return screenshotPath;
    }
}
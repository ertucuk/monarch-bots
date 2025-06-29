const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')

module.exports = {
    Name: 'menü',
    Aliases: ['menu', 'rolmenü', 'rolmenu'],
    Description: 'Rol seçme mesajını attırırsınız.',
    Usage: 'menü',
    Category: 'Founder',
    Cooldown: 0,

    Permissions: {
        User: [],
        Role: []
    },

    Command: {
        Prefix: true,
    },

    messageRun: async (client, message, args, ertu) => {
        const row = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'menu:first:',
                    label: 'た',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    customId: 'menu:second',
                    label: 'ぞ',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    customId: 'menu:third',
                    label: 'ぜ',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    customId: 'menu:fourth',
                    label: 'ご',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    customId: 'menu:fifth',
                    label: 'さ',
                    style: ButtonStyle.Secondary,
                }),
            ],
        })

        const row2 = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'menu:sixth',
                    label: 'み',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    customId: 'menu:seventh',
                    label: 'ふ',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    customId: 'menu:eighth',
                    label: 'べ',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    customId: 'menu:ninth',
                    label: 'が',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    customId: 'menu:tenth',
                    label: 'え',
                    style: ButtonStyle.Secondary,
                }),
            ],
        })

        const row3 = new ActionRowBuilder({
            components: [
                new ButtonBuilder({
                    customId: 'menu:eleventh',
                    label: 'ぅ',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    customId: 'menu:twelfth',
                    label: 'み',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    customId: 'menu:thirteenth',
                    label: 'に',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    customId: 'menu:fourteenth',
                    label: 'の',
                    style: ButtonStyle.Secondary,
                }),

                new ButtonBuilder({
                    customId: 'menu:fifteenth',
                    label: 'た',
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

        const embed = new EmbedBuilder({
            color: client.getColor('random'),
            description: [
                `**__RENK ROLLERİ SEÇİM MENÜSÜ__**`,
                `Merhaba! Sunucuda kendine en uygun rengi seçerek tarzını yansıtabilirsin!`,
                `Aşağıdaki butonlardan birine basarak **renk rolünü** al ve kendini ifade et!`,
                `**Mevcut Renkler:**`,
                `### **<@&904188905899831344>**`,
                `### **<@&1082981508236714044>**`,
                `### **<@&904188905899831346>**`,
                `### **<@&904188905899831343>**`,
                `### **<@&1040706373987602454>**`,
                `### **<@&911734879031545896>**`,
                `### **<@&904188905899831345>**`,
                `### **<@&1158061131588444193>**`,
                `### **<@&1158061523919446056>**`,
                `### **<@&1158061139687645204>**`,
                `### **<@&1158061143747735652>**`,
                `### **<@&1158061148353081445>**`,
                `### **<@&1158061522032001044>**`,
                `### **<@&904188905790795781>**`,
                `### **<@&1345723387359527013>**`,
                `**Unutma!**`,
                '- Aynı anda sadece **bir** renk seçebilirsin!',
                '- Yeni bir renk seçtiğinde eski rengin **otomatik olarak kaldırılacak.**',
                '- Tarzını değiştirip farklı renkleri **denemekten çekinme!**'
            ].join('\n')
        })

        message.channel.send({
            embeds: [embed],
            components: [row, row2, row3],
        });
        
    },
};
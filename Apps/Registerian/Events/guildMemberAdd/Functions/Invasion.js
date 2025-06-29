const { bold } = require('discord.js');

const ONE_DAY = 1000 * 60 * 60 * 24;
const SUSPECT_TIME = 1000 * 60 * 60 * 24 * 7;
const IN_TIMES = 5 * 60 * 1000;

module.exports = async function Invasion(client, member, ertu, channel) {
    const fakeAccounts = member.guild.members.cache.filter(
        (member) => (Date.now() - member.user.createdTimestamp) / ONE_DAY < SUSPECT_TIME && Date.now() - member.joinedTimestamp < IN_TIMES,
    ).size

    if (fakeAccounts >= 7) {
        if (ertu.systems.invasion) return true;
        ertu.systems.invasion = true;
        member.guild?.updateSettings({
            system: ertu.systems
        });

        channel.send({
            content: `Fake hesap istilası tespit edildi. Sunucumuza ${bold('5 dakika')} içerisinde ${bold('7')} fake hesap giriş yaptığı için otorol işlemi durduruldu. Lütfen bu süreç içerisinde yetki sahibi kişilerin müdahalesini bekleyin.`
        });

        return true;
    }

    return false;
}
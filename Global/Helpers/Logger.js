const { green, cyan, yellow, red } = require('chalk'), moment = require('moment');

module.exports = class Logger {
    static success(content) {
        console.log(`[${moment().format('l')}]: ( ${green('SUCCESS')} ) ${cyan(`${content}`)}`);
    };

    static async debug(content) {
        console.log(`[${moment().format('l')}]: ( ${green('DEBUG')} ) ${cyan(`${content}`)}`);
    };

    static log(content) {
        console.log(`[${moment().format('l')}]: ( ${cyan('LOG')} ) ${cyan(`${content}`)}`);
    };

    static warn(content) {
        console.log(`[${moment().format('l')}]: ( ${yellow('WARN')} ) ${cyan(`${content}`)}`);
    };

    static async error(content, options) {
        if (options?.error) {
            console.log(`[${moment().format('l')}]: ( ${red('ERROR')} ) ${cyan(`${options.error}`)}`);
        } else {
            console.log(`[${moment().format('l')}]: ( ${red('ERROR')} ) ${cyan(`${content}`)}`);
        }
    };

    static async loaded(client) {
        console.log(`[${moment().format('l')}]: ( ${green('SUCCESS')} ) ${cyan(`${`@` + client.user.tag + ' başlatıldı.'}`)}`);
    }

    static line() {
        console.log(`[${moment().format('l')}]: ${cyan(`――――――――――――――――――――――――――――――――――――――――――――――――――――――――`)}`);
    };
}
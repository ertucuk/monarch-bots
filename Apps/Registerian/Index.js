(async () => {
    const { ertuClient } = require('../../Global/Base/Client');
    const { Main } = require('../../Global/Settings/System');

    const client = global.client = new ertuClient({
        Token: Main.Registerian,
        Prefix: Main.Prefix,

        Debugger: false,
        Commands: false,
    });

    await client.spawn();
})();
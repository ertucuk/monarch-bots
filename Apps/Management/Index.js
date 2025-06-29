(async () => {
    const { ertuClient } = require('../../Global/Base/Client');
    const { Main } = require('../../Global/Settings/System');

    const client = global.client = new ertuClient({
        Token: Main.Management,
        Prefix: Main.Prefix,

        Debugger: false,
        Commands: true,
    });

    await client.spawn();
})();
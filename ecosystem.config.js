const settings = require('./Global/Settings/System');

let bots = [];

if (settings.Welcome.Tokens.length > 0)
    bots.push({
        name: 'Monarch-Welcomes',
        namespace: 'Monarch',
        script: 'Start.js',
        watch: false,
        exec_mode: 'cluster',
        max_memory_restart: '2G',
        cwd: './Apps/Welcomes/',
        args: ['--color', '--watch'],
    });

if (settings.Main.Management)
    bots.push({
        name: 'Monarch-Management',
        namespace: 'ertu',
        script: 'Index.js',
        watch: false,
        exec_mode: 'cluster',
        max_memory_restart: '2G',
        cwd: './Apps/Management',
        args: ['--color', '--watch'],
    });

if (settings.Main.Registerian)
    bots.push({
        name: 'Monarch-Registerian',
        namespace: 'ertu',
        script: 'Index.js',
        watch: true,
        exec_mode: 'cluster',
        max_memory_restart: '2G',
        cwd: './Apps/Registerian',
        args: ['--color', '--watch'],
    });

if (settings.Main.Statistics)
    bots.push({
        name: 'Monarch-Statistics',
        namespace: 'ertu',
        script: 'Index.js',
        watch: true,
        exec_mode: 'cluster',
        max_memory_restart: '2G',
        cwd: './Apps/Statistics',
        args: ['--color', '--watch'],
    });

if (settings.Main.Kingdom)
    bots.push({
        name: 'Monarch-Kingdom',
        namespace: 'ertu',
        script: 'Index.js',
        watch: true,
        exec_mode: 'cluster',
        max_memory_restart: '2G',
        cwd: './Apps/Kingdom',
        args: ['--color', '--watch'],
    });

module.exports = { apps: bots };
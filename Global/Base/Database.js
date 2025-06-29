const mongoose = require('mongoose');

class DatabaseConnection {
    static async start(client) {
        try {
            mongoose.connect(client.system.database, {
                useUnifiedTopology: true,
                useNewUrlParser: true,
            });
            
            client.logger.success('MongoDB bağlantısı kuruldu.');

            mongoose.connection.on('error', (err) => {
                client.logger.error(`MongoDB bağlantı hatası: \n${err.stack}`);
            });

            mongoose.connection.on('disconnected', () => {
                client.logger.error('MongoDB bağlantısı kesildi.');
                setTimeout(() => {
                    DatabaseConnection.start(client);
                }, 5000);
            });
        } catch (error) {
            client.logger.error(`MongoDB bağlantı hatası: \n${error.stack}`);
            setTimeout(() => {
                DatabaseConnection.start(client);
            }, 5000);
        }
    }

    static async ping() {
        try {
            const currentNano = process.hrtime();
            await mongoose.connection.db.command({ ping: 1 });
            const time = process.hrtime(currentNano);
            return (time[0] * 1e9 + time[1]) * 1e-6;
        } catch (error) {
            throw new Error(`MongoDB ping hatası: ${error.message}`);
        }
    }
}

module.exports = DatabaseConnection;
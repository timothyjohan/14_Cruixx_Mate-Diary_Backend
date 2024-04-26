const Sequelize = require("sequelize");
const db = new Sequelize(
    "cruixx_mate_diary",
    "root",
    "",
    {
        host: "localhost",
        port: 3306,
        dialect: "mysql",
        loggin: false
    }
);

module.exports = {
    initDB: () => {
        return db.authenticate();
    },
    getDB: () => {
        return db;
    },
};

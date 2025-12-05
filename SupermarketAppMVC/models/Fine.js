const db = require('../db');

const Fine = {
    getByIds(ids, callback) {
        // feature removed -> return empty set
        return callback(null, []);
    },
    markPaid(ids, callback) {
        // feature removed -> no-op success
        return callback(null);
    },
    addFine(fine, callback) {
        // feature removed -> no-op success
        return callback(null);
    },
    getFineTypes(callback) {
        return callback(null, []);
    },
    getAllWithUser(callback) {
        return callback(null, []);
    },
    getAllWithUserAndType(callback) {
        return callback(null, []);
    },
    getByUserIdWithType(userId, callback) {
        return callback(null, []);
    }
};

module.exports = Fine;

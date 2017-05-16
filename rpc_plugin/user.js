const r = require('rethinkdb');
const uuid = require('uuid');

const logger = module.parent.exports.logger;
var config;
var db;

const methods = {
    login: function(args, opt, callback){
        callback(new Error('not yet ready'));
    },

    add: function(args, opt, callback){
        callback(new Error('not yet ready'));
    }
}

function user(conf){
    config = conf;
    try{
        db = require(`../${config.libDir}/db`);
        db.configure(config);
        return methods;
    }
    catch(err){
        logger.error(err.message);
    }
}

module.exports = user;

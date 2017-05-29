const r = require('rethinkdb');
const logger = module.parent.exports.logger;
const db = require('../lib/db');

const className = 'dir';
var config;

const methods = {
    name: function(args, opt, callback){
        let errcode = 1101;
        let reql = r.table('settings').withFields(['name']);
        logger.debug(`<${className}.name>: incoming request params: ${JSON.stringify(args)}`);
        db.read(module.parent.exports.getDBConnection, reql, errcode, args, opt, callback);
    },

    headers: function(args, opt, callback){
        let errcode = 1102;
        let reql = r.table('settings').withFields(['headers']);
        logger.info(`<${className}.headers>: incoming request: ${JSON.stringify(args)}`);
        db.read(module.parent.exports.getDBConnection, reql, errcode, args, opt, callback);
    },


    description: function(args, opt, callback){
        let errcode = 1103;
        let reql = r.table('settings').withFields(['description']);
        logger.info(`<${className}.description>: incoming request: ${JSON.stringify(args)}`);
        db.read(module.parent.exports.getDBConnection, reql, errcode, args, opt, callback);
    }

}

function dir(conf){
    config = conf;
    try{
        db.configure(conf);
        return methods;
    }
    catch(err){
        logger.error(err.message);
    }
}

module.exports = dir;

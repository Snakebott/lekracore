const r = require('rethinkdb');
const logger = module.parent.exports.logger;
var config;
var db;
const methods = {
    name: function(args, opt, callback){
        logger.info(`incoming request: ${JSON.stringify(args)}`);
        db.query(r.table('settings').withFields(['name']), args, opt, callback);
    },

    headers: function(args, opt, callback){
        logger.info(`incoming request: ${JSON.stringify(args)}`);
        db.query(r.table('settings').withFields(['headers']), args, opt, callback);
    },


    description: function(args, opt, callback){
        logger.info(`incoming request: ${JSON.stringify(args)}`);
        db.query(r.table('settings').filter({description: {enable: true}}), args, opt, callback);
    }

}

function dir(conf){
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

module.exports = dir;

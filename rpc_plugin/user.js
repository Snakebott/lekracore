const r = require('rethinkdb');
const path = require('path');
const uuid = require('uuid');
const db = require('../lib/db');
const md5 = require('md5');

const logger = module.parent.exports.logger;

var config;
const className = '<user>';

const methods = {
    login: function(args, opt, callback){
        let errcode = 1201;
        let dbconn = module.parent.exports.getDbConnection;
        if(typeof(args) !== 'object'){
            logger.warn(`${className}: warning, invalid parameters ${JSON.stringify(args)}`);
        }
        else{
            let {email:email, password:password} = args;
            logger.debug(`${className}: incoming data ${JSON.stringify(args)}`);
            db.read(dbconn, r.table('users'), errcode, args, opt, callback);
        }
    },

    add: function(args, opt, callback){
        callback(new Error('not yet ready'));
    }
}

function user(conf){
    config = conf;
    try{
        db.configure(conf);
        return methods;
    }
    catch(err){
        logger.error(err.message);
    }
}

module.exports = user;

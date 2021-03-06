const r = require('rethinkdb');
const path = require('path');
const uuid = require('uuid');
const db = require('../lib/db');
const md5 = require('md5');

const logger = module.parent.exports.logger;

var config;
const className = 'user';

const methods = {
    
    login: function(args, opt, callback){
        let errcode = 1201;
        let dbconn = module.parent.exports.getDBConnection();
        
        if(!dbconn.open){
            logger.error(`<${className}.login>: database not opened`);
            db.error(new Error('database closed'), errcode, callback);
        }
        else if(typeof(args) !== 'object'){
            logger.warn(`${className}: warning, invalid parameters ${JSON.stringify(args)}`);
        }
        else{
            let {email:email, password:password} = args;
            logger.debug(`${className}: incoming data ${JSON.stringify(args)}`);
            let reql = r.table('users')
            .filter({userinfo: {email: email}, password: md5(password)})
            .without(['access_id', 'enable', 'password', 'userinfo', 'user_id']);
            reql.run(dbconn, (err, cursor)=>{
                if(err){
                    db.error(err, errcode, callback);
                }
                else{
                    cursor.toArray().then((rows)=>{
                        logger.debug(`<${className}.login>: database query ok: ${JSON.stringify(rows)}`);
                        if(rows.length > 0){
                            if(rows[0].token !== null){
                                logger.info(`<${className}>: user ${args.email} was logged in`);
                                callback(null, {token: rows[0].token.token});
                            }
                            else{
                                let token = uuid(new Date()).replace(/-/g, '') + uuid.v4().replace(/-/g, '');
                                r.table('users').filter({userinfo: {email: email}, password: md5(password)})
                                .update({token: {token: token, date: new Date().getTime()}}).run(dbconn, (err, result)=>{
                                    if(err){
                                        db.error(err, errcode, callback);
                                    }
                                    else{
                                        logger.info(`<${className}.login>: user ${args.email} was logged in`);
                                        callback(null, {token: token});
                                    }
                                });
                            }
                        }
                        else{
                            logger.warn(`<${className}.login>: user login failed ${email}`);
                            callback(new Error('bad email or password'));
                        }
                    }, (err)=>{
                        db.error(err, errcode, callback);
                    });
                }
            });
        }

    },

    //
    logout: function(args, opt, callback){
        let errcode = 1202;
        callback(null, {msg: 'not yet ready'});
    },

    add: function(args, opt, callback){
        callback(new Error('not yet ready'));
    },

    delete: function(args, opt, callback){
        callback(null, {msg: 'not yet ready'});
    },

    edit: function(args, opt, callback){
        callback(null, {msg: 'not yet ready'});
    },

    grant: function(args, opt, callback){
        callback(null, {msg: 'not yet ready'});
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

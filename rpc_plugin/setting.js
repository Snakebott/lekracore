const r = require('rethinkdb');
const logger = module.parent.exports.logger;
const db = require('../lib/db');

const className = 'setting';
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
    },

    setname: function(args, opt, callback){
        let errcode =1104;
        let access = 50;
        let dbconn = module.parent.exports.getDBConnection();
        let {token:token, name:name} = args;
        if(!token || !name){
            logger.warn(`<${className}.setname>: warn, bad parameters`);
            callback(new Error(`invalid parameters`));
        }
        else{
            logger.info(`<${className}.setname>: incoming update name ${JSON.stringify(args)}`);
            db.checkToken(module.parent.exports.getDBConnection, token).then((key)=>{
                logger.info(`<${className}.setname>: get token success`);
                if(key.length === 0){
                    logger.warn(`<${className}.setname>: bad token, auth error`);
                    callback(new Error('auth error'));
                }
                else if(key[0].access_id < access){
                    logger.warn(`<${className}.setname>: warn, permission denied`);
                    callback(new Error(`permission denied`));
                }
                else{
                    logger.info(`<${className}.setname>: aut success, try set name`);
                    r.table('settings').update({name: name}).run(dbconn).then((result)=>{
                        logger.info(`<${className}.setname>: name update success ${JSON.stringify(result)}`);
                        callback(null, {msg: 'name updated', meta: result});
                    }).catch((err)=>{
                        logger.error(`<${className}.setname>: database error ${err.message}`);
                        db.error(err, errcode, callback);
                    });
                }
            }).catch((err)=>{
                logger.error(`<${className}.setname>: error ${err.message}`);
                db.error(err, errcode, callback);
            });
        }
    },

    setheaders: function(args, opt, callback){
        callback(null, {msg: 'not yet ready'});
    },

    setdescription: function(args, opt, callback){
        let errcode = 1106;
        let access = 50;
        let dbconn = module.parent.exports.getDBConnection();
        let {token:token, description:description} = args;
        if(!token || !description){
            logger.warn(`<${className}.setdecription>: warn, bad parameters`);
            callback(new Error('invalid parameters'));
        }
        else{
            db.checkToken(module.parent.exports.getDBConnection, token).then((key)=>{
                if(key.length === 0){
                    logger.warn(`<${className}.setdescription>: warn, auth error ${JSON.stringify(args)}`);
                    callback(new Error('auth error'));
                }
                else if(key[0].access_id < access){
                    logger.warn(`<${className}.setdescription>: warn, permission denied ${JSON.stringify(args)}`);
                    callback(new Error('permission denied'));
                }
                else{
                    r.table('settings').update({description: description}).run(dbconn).then((result)=>{
                        logger.info(`<${className}.setdescription>: description updated`);
                        callback(null, {msg: 'description updated', meta: result});
                    }).catch((err)=>{
                        logger.error(`<${className}.setdesription>: database error ${err.message}`);
                        db.error(err, errcode, callback);
                    });
                }
            }).catch((err)=>{
                logger.error(`<${className}.setdescription>: get token error ${err.message}`);
                db.error(err, errcode, callback);
            });
        }
    }

}

function setting(conf){
    config = conf;
    try{
        db.configure(conf);
        return methods;
    }
    catch(err){
        logger.error(err.message);
    }
}

module.exports = setting;

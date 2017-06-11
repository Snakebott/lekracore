const r = require('rethinkdb');
const log4js = require('log4js');
var config = {};
var logger;

function configure(conf){
    try{
        config = conf;
        log4js.configure(config.logger);
        logger = log4js.getLogger(config.currentLogger);
        logger.setLevel();
    }
    catch(err){
        throw err;
    }
}

function sendError(err, errcode, callback){
    logger.error(`Error occuried ${errcode}: ${err.message || 'Unknown Error'}`);
    logger.debug(err);
    callback(new Error(`Internal Server Error #${errcode}`));
}

function read(getDBConn, reql, errcode, args, opt, callback){
    try{
        let dbconn = getDBConn();
        if(!dbconn.open){
            sendError(new Error(`Can not execute the query, the database is closed`), errcode, callback);
        }
        else{
            reql.run(dbconn).then((cursor)=>{
                logger.debug(`database query ok`);

                cursor.on('error', (err)=>{
                    sendError(err || new Error(`cursor error ${err.message}`), errcode, callback);
                });

                cursor.toArray().then((rows)=>{
                    callback(null, rows);

                }, (err)=>{
                    sendError(err, errcode, callback);
                });

            }, (err)=>{
                sendError(err, errcode, callback);
            });
        }
    }
    catch(err){
        sendError(err, errcode, callback);
    }
}

function checkToken(getDBConn, token){
    return new Promise((resolve, reject)=>{
        try{
            var dbconn = getDBConn();
        }
        catch(err){
            logger.error(`Error check token: ${err.message }`);
            reject(err);
        }

        r.table('users').filter({token: {token: token}})
        .withFields(['access_id', 'token', 'user_id'])
        .run(dbconn).then((cursor)=>{
            
            cursor.toArray().then((result)=>{
                logger.debug(`check token result: ${JSON.stringify(result)}`);
                resolve(result);
            }).catch((err)=>{
                logger.debug(err);
                reject(err);
            });
        }).catch((err)=>{
            logger.debug(err);
            reject(err);
        })

    });
}

//
module.exports.read = read;
module.exports.error = sendError;
module.exports.configure = configure;
module.exports.checkToken = checkToken;

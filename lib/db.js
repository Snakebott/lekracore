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
            sendError(new Error(`Can not execute the query, the database is closed`), 31, callback);
        }
        else{
            reql.run(dbconn).then((cursor)=>{
                logger.debug(`database query ok`);

                cursor.on('err', (err)=>{
                    sendError(err || new Error(`cursor error ${err.message}`), 34, callback);
                });

                cursor.toArray().then((rows)=>{
                    callback(null, rows);

                }, (err)=>{
                    sendError(err, 35, callback);
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

//
module.exports.read = read;
module.exports.error = sendError;
module.exports.configure = configure;

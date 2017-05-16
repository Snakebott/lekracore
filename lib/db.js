const r = require('rethinkdb');
const Snakelog = require('snakelog');
var config = {};
var logger;

function configure(conf){
    try{
        config = conf;
        logger = new Snakelog(conf.logger);
        logger.setLevel(conf.level);
    }
    catch(err){
        throw err;
    }
}

function query(reql, args, opt, callback){
    r.connect(config.dbconfig.connection).then((conn)=>{
        logger.debug(`database connection success`);
        reql.run(conn).then((cursor)=>{
            logger.debug(`Query to database ${config.dbconfig.connection.db} success`);    
                
            cursor.on('error', (err)=>{
                logger.error(`database query error#3 ${err.message}`);
                logger.debug(err);
            });

            cursor.toArray().then((rows)=>{
                logger.debug(`cursor to array success`);
                callback(null, rows);
            }, (err)=>{
                logger.error(`database cursor error#4 ${err.message}`);
                logger.debug(err);
                callback(new Error(`internal server error#4`));
            });

        }, (err)=>{
            logger.error(`database query error: ${err.message}`);
            logger.debug(err);
            callback(new Error(`internal server error#2`));
        });

    }, (err)=>{
            logger.error(`Database connection error: ${err.message}`);
            logger.debug(err);
            callback(new Error(`Internal Server error#1`));
    });
}

module.exports.query = query;
module.exports.configure = configure;

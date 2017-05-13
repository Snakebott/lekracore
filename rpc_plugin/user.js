const r = require('rethinkdb');
const logger = module.parent.exports.logger;

function _dbQuery(args, opt, callback, reql){
    r.connect(config.dbconfig.connection).then((conn)=>{
        logger.debug(`database connection success`);
        reql.run(conn).then((cursor)=>{
            logger.debug(`Query to database ${config.dbconfig.connection.db} success`);    
                
            cursor.on('error', (err)=>{
                logger.error(`database query error#3 ${err.message}`);
                logger.debug(err);
            });

            cursor.toArray().then((rows)=>{
                logger.debug(`get doclist success`);
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

const methods = {

    test: function(args, opt, callback){
        callback(null, config);
    },

    doclist: (args, opt, callback)=>{
        _dbQuery(args, opt, callback, r.table('docs').without(['docDescription', 'id']));
    },

    doc: function(args, opt, callback){
        try{
            if(typeof(args.docID) !== 'number'){
                logger.debug(`invalid parameter docID: ${JSON.stringify(args)}`);
                callback(new Error(`invalid parameters or docID is not number`));
            }
            else{
                _dbQuery(args, opt, callback, r.table('docs').filter({docID: args.docID}));
            }
        }
        catch(err){
            logger.debug(`invalid parameter: ${JSON.stringify(args)}`);
            callback(new Error(`invalid parameters`));
        }
    },

    images: function(args, opt, callback){
        try{
            if(typeof(args.docID) !== 'number'){
                logger.debug(`invalid parameter docID: ${JSON.stringify(args)}`);
                callback(new Error(`invalid parameters or docID is not number`));
            }
            else{
                _dbQuery(args, opt, callback, r.table('images').filter({docID: args.docID}));
            }
        }
        catch(err){
            logger.debug(`invalid parameters ${JSON.stringify(args)}`);
            callback(new Error(`invalid parameters`));
        }
    },

    imageinfo: function(args, opt, callback){
        try{
            if(typeof(args.imageID) !== 'number'){
                logger.debug(`invalid parameter imageID: ${JSON.stringify(args)}`);
                callback(new Error(`invalid parameter or imageID is not number`));
            }
            else{
                _dbQuery(args, opt, callback, r.db('lekra').table('images').filter({imageID: args.imageID}).without('image'));
            }
        }
        catch(err){
            logger.debug(`invalid parameters: ${args}`);
            callback(new Error(`invalid parameters`));
        }
    }
}

function user(conf){
    config = conf;
    return methods;
}

module.exports = user;


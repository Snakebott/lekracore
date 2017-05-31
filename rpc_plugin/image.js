
const r = require('rethinkdb');
const logger = module.parent.exports.logger;
const db = require('../lib/db');
var config;

const className = 'image';

const methods = {
    
    get: function(args, opt, callback){
        callback(null, {msg: 'not yet ready'});
    },

    info: function(args, opt, callback){
        let errcode = 1005;
        logger.info(`<${className}.info>: incoming request params: ${JSON.stringify(args)}`);
        try{
            if(typeof(args.imageID) !== 'number'){
                logger.warn(`<${className}.docs>: bad request incoming: ${JSON.stringify(args)}`);
                callback(new Error(`Bad request: imageID must be a number, example: {"imageID": 100}`));
            }
            else{
                db.read(module.parent.exports.getDBConnection, r.table('images').filter({imageID: args.imageID}).without(['image', 'id']), errcode, args, opt, callback);
            }
        }
        catch(err){
            logger.debug(err);
            logger.warn(`<${className}.info>: bad request incoming ${JSON.stringify(args)}`);
            callback(new Error(`Bad request: imageID must be a number, example: {"imageID": 100}`));
        }
    },

    get: function(args, opt, callback){
        let errcode = 1004;
        logger.info(`<${className}.get>: incoming request params: ${JSON.stringify(args)}`);
        try{
            if(typeof(args.docID) !== 'number'){
                logger.warn(`<${className}.get>: bad request incoming: ${JSON.stringify(args)}`);
                callback(new Error(`Bad request: docID must be a number, example: {"docID": 100}`));
            }
            else{
                db.read(module.parent.exports.getDBConnection, 
                r.table('images').filter({docID: args.docID}), 
                errcode, args, opt, callback);
            }
        }
        catch(err){
            logger.debug(err);
            logger.warn(`<${className}.get>: bad request incoming ${JSON.stringify(args)}`);
            callback(new Error(`Bad request: docID must be a number, example: {"docID": 100}`));
        }
    }

}



function image(conf){
    config = conf;
    try{
        db.configure(conf);
        return methods;
    }
    catch(err){
        logger.error(err.message);
    }
}

module.exports = image;
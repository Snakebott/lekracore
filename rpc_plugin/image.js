
const r = require('rethinkdb');
const logger = module.parent.exports.logger;
const db = require('../lib/db');
var config;

const className = 'image';

const methods = {

    //    
    info: function(args, opt, callback){
        let errcode = 1301;
        logger.info(`<${className}.info>: incoming request params: ${JSON.stringify(args)}`);
        try{
            if(typeof(args.image_id) !== 'number'){
                logger.warn(`<${className}.docs>: bad request incoming: ${JSON.stringify(args)}`);
                callback(new Error(`Bad request: image_id must be a number, example: {"image_id": 100}`));
            }
            else{
                db.read(module.parent.exports.getDBConnection, 
                r.table('images').filter({image_id: args.image_id}).without(['image', 'id']), errcode, args, opt, callback);
            }
        }
        catch(err){
            logger.debug(err);
            logger.warn(`<${className}.info>: bad request incoming ${JSON.stringify(args)}`);
            callback(new Error(`Bad request: image_id must be a number, example: {"image_id": 100}`));
        }
    },

    get: function(args, opt, callback){
        let errcode = 1304;
        logger.info(`<${className}.get>: incoming request params: ${JSON.stringify(args)}`);
        try{
            if(typeof(args.doc_id) !== 'number'){
                logger.warn(`<${className}.get>: bad request incoming: ${JSON.stringify(args)}`);
                callback(new Error(`Bad request: doc_id must be a number, example: {"doc_id": 100}`));
            }
            else{
                db.read(module.parent.exports.getDBConnection, 
                r.table('images').filter({doc_id: args.doc_id}), 
                errcode, args, opt, callback);
            }
        }
        catch(err){
            logger.debug(err);
            logger.warn(`<${className}.get>: bad request incoming ${JSON.stringify(args)}`);
            callback(new Error(`Bad request: doc_id must be a number, example: {"doc_id": 100}`));
        };
    },

    add: function(args, opt, callback){
        let errcode = 1305;
        callback(null, 'not yet ready');
    },

    delete: function(args, opt, callback){
        let errcode = 1306;
        callback(null, 'not yet ready');
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

const r = require('rethinkdb');
const logger = module.parent.exports.logger;
const db = require('../lib/db');
var config;

const className = 'docs';

//
const methods = {
    //
    list: (args, opt, callback)=>{
        let errcode = 1001;
        logger.info(`<${className}.doclist>: incoming request params: ${JSON.stringify(args)}`);
        db.read(module.parent.exports.getDBConnection, r.table('docs').withFields(['docName']), errcode, args, opt, callback);
    },

    doc: function(args, opt, callback){
        let errcode = 1002;
        logger.info(`<${className}.doc>: incoming request params: ${JSON.stringify(args)}`);
        try{
            if(typeof(args.docID) !== 'number'){
                logger.warn(`<${className}.docs>: bad request incoming: ${JSON.stringify(args)}`);
                callback(new Error(`Bad request: docID must be a number, example: {"docID": 100}`));
            }
            else{
                db.read(module.parent.exports.getDBConnection, r.table('docs').filter({docID: args.docID}), errcode, args, opt, callback);
            }
        }
        catch(err){
            logger.debug(err);
            logger.warn(`<${className}.docs>: bad request incoming ${JSON.stringify(args)}`);
            callback(new Error(`Bad request: docID must be a number, example: {"docID": 100}`));
        };
    },

    images: function(args, opt, callback){
        let errcode = 1004;
        logger.info(`<${className}.images>: incoming request params: ${JSON.stringify(args)}`);
        try{
            if(typeof(args.docID) !== 'number'){
                logger.warn(`<${className}.images>: bad request incoming: ${JSON.stringify(args)}`);
                callback(new Error(`Bad request: docID must be a number, example: {"docID": 100}`));
            }
            else{
                db.read(module.parent.exports.getDBConnection, r.table('images').filter({docID: args.docID}), errcode, args, opt, callback);
            }
        }
        catch(err){
            logger.debug(err);
            logger.warn(`<${className}.images>: bad request incoming ${JSON.stringify(args)}`);
            callback(new Error(`Bad request: docID must be a number, example: {"docID": 100}`));
        }
    },

    imageinfo: function(args, opt, callback){
        let errcode = 1005;
        logger.info(`<${className}.imageinfo>: incoming request params: ${JSON.stringify(args)}`);
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
            logger.warn(`<${className}.images>: bad request incoming ${JSON.stringify(args)}`);
            callback(new Error(`Bad request: imageID must be a number, example: {"imageID": 100}`));
        }
    },

    add: function(args, opt, callback){
        callback(null, {msg: 'not yet ready'});
    },

    delete: function(args, opt, callback){
        callback(null, {msg: 'not yet ready'});
    },

    addimage: function(args, opt, callback){
        callback(null, {msg: 'not yet ready'});
    },

    deleteimage: function(args, opt, callback){
        callback(null, {msg: 'not yet ready'});
    },

    find: function(args, opt, callback){
        callback(null, {msg: 'not yet ready'});
    }
}

function docs(conf){
    config = conf;
    try{
        db.configure(conf);
        return methods;
    }
    catch(err){
        logger.error(err.message);
    }
}

module.exports = docs;


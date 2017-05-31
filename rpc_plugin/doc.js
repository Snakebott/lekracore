
const r = require('rethinkdb');
const logger = module.parent.exports.logger;
const db = require('../lib/db');
var config;

const className = 'doc';

//
const methods = {
    //
    list: (args, opt, callback)=>{
        let errcode = 1001;
        logger.info(`<${className}.list>: incoming request params: ${JSON.stringify(args)}`);
        db.read(module.parent.exports.getDBConnection, r.table('docs').withFields(['docName']), errcode, args, opt, callback);
    },

    get: function(args, opt, callback){
        let errcode = 1002;
        logger.info(`<${className}.get>: incoming request params: ${JSON.stringify(args)}`);
        try{
            if(typeof(args.docID) !== 'number'){
                logger.warn(`<${className}.get>: bad request incoming: ${JSON.stringify(args)}`);
                callback(new Error(`Bad request: docID must be a number, example: {"docID": 100}`));
            }
            else{
                db.read(module.parent.exports.getDBConnection, r.table('docs').filter({docID: args.docID}), errcode, args, opt, callback);
            }
        }
        catch(err){
            logger.debug(err);
            logger.warn(`<${className}.get>: bad request incoming ${JSON.stringify(args)}`);
            callback(new Error(`Bad request: docID must be a number, example: {"docID": 100}`));
        };
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

function doc(conf){
    config = conf;
    try{
        db.configure(conf);
        return methods;
    }
    catch(err){
        logger.error(err.message);
    }
}

module.exports = doc;


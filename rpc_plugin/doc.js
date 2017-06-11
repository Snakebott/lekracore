
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
        db.read(module.parent.exports.getDBConnection, r.table('docs').withFields(['name', 'doc_id']), errcode, args, opt, callback);
    },

    get: function(args, opt, callback){
        let errcode = 1002;
        logger.info(`<${className}.get>: incoming request params: ${JSON.stringify(args)}`);
        try{
            if(typeof(args.doc_id) !== 'number'){
                logger.warn(`<${className}.get>: bad request incoming: ${JSON.stringify(args)}`);
                callback(new Error(`Bad request: doc_id must be a number, example: {"doc_id": 100}`));
            }
            else{
                db.read(module.parent.exports.getDBConnection, 
                r.table('docs').filter({doc_id: args.doc_id}), errcode, args, opt, callback);
            }
        }
        catch(err){
            logger.debug(err);
            logger.warn(`<${className}.get>: bad request incoming ${JSON.stringify(args)}`);
            callback(new Error(`Bad request: doc_id must be a number, example: {"doc_id": 100}`));
        };
    },

    add: function(args, opt, callback){
        let errcode = 1006;
        let access = 30;
        let {token:token, doc:doc} = args;
        if(!token || !doc || !doc.name || !doc.text){
            logger.warn(`<${className}.add>: bad request incoming ${JSON.stringify(args)}`);
            callback(new Error(`invalid parameters: errcode ${errcode}`));
        }
        else{
            db.checkToken(module.parent.exports.getDBConnection, token).then((token)=>{
                logger.info(`<${className}.add>: get token result ok`);
                if(token.length === 0){
                    logger.warn(`<${className}.add>: user auth error`);
                    callback(new Error(`auth error`));
                }
                else{
                    logger.info(`<${className}.add>: check token success`);
                    if(token[0].access_id <= access){
                        logger.warn(`<${className}>.add: user permisson denied operation access[${access}], 
                            user access[${token[0].access_id}]`);
                        callback(new Error(`permission denied`));
                    }
                    else{
                        logger.info(`<${className}.add>: auth success`);
                        r.table('docs').filter({name: doc.name}).run(module.parent.exports.getDBConnection()).then((cursor)=>{

                            cursor.toArray().then((existDoc)=>{
                                if(existDoc.length > 0){
                                    logger.warn(`<${className}.add>: document with name ${doc.name} exists`);
                                    callback(new Error(`document with name ${doc.name} exists`));
                                }
                                else{
                                    r.table('docs').max({index: 'doc_id'}).run(module.parent.exports.getDBConnection()).then((lastDoc)=>{
                                        let newDoc = {
                                            access_id: token[0].access_id,
                                            doc_id: lastDoc.doc_id + 1,
                                            uploader: token[0].user_id,
                                            name: doc.name,
                                            text: doc.text,
                                            upload_date: new Date().toISOString()
                                        }
                                        r.table('docs').insert(newDoc).run(module.parent.exports.getDBConnection()).then((result)=>{
                                            logger.info(`<${className}.add>: document ${doc.name} inserted with doc_id ${newDoc.doc_id}`);
                                            callback(null, {msg: 'document was added', doc_id: newDoc.doc_id});
                                        }).catch((err)=>{
                                            logger.error(`<${className}.add>: database insert error ${err.message}`);
                                            db.error(err, errcode, callback);
                                        });
                                    }).catch((err)=>{
                                        logger.error(`<${className}.add>: database error ${err.message}`);
                                        db.error(err, errcode, callback);
                                    });
                                }
                            }).catch((err)=>{
                                logger.error(`<${className}.add>: database cursor error ${err.message}`);
                                db.error(err, errcode, callback);
                            });
                        }).catch((err)=>{
                            logger.error(`<${className}.add>: database error ${err.message}`);
                            sb.error(err, errcode, callback);
                        });
                    }
                }
            }).catch((err)=>{
                logger.error(`<${className}.add>: error get token, ${err.message}`);
                db.error(err, errcode, callback);
            });   
        }

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


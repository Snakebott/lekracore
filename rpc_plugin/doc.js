
const r = require('rethinkdb');
const logger = module.parent.exports.logger;
const db = require('../lib/db');
const uuid = require('uuid');
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
        let errcode = 1009;
        let {token:token, doc:doc} = args;
        let dbconn = module.parent.exports.getDBConnection();
        if(!token || !doc || !doc.doc_id){
            logger.warn(`<${className}.delete>: invalid parameters ${JSON.stringify(args)}`);
            callback(new Error('invalid parameters'));
        }
        else{
            db.checkToken(module.parent.exports.getDBConnection, token).then((token)=>{
                logger.info(`<${className}.delete>: get token success`);
                if(token.length === 0){
                    logger.warn(`<${className}.delete>: warn bad token`);
                    callback(new Error('auth error'));
                }
                else{
                    r.table('docs').filter({doc_id: doc.doc_id}).run(dbconn).then((cursor)=>{

                        cursor.toArray().then((delDoc)=>{
                            if(delDoc.length === 0){
                                logger.warn(`<${className}.delete>: warn, document with id ${doc.doc_id} no found`);
                                callback(new Error(`document with id ${doc.doc_id} not found`));
                            }
                            else if(token[0].access_id < delDoc[0].access_id){
                                logger.warn(`<${className}.delete>: warn, permission denied operation access[${delDoc[0].doc_id}] 
                                user access[${token[0].access_id}]`);
                                callback(new Error('permission denied'));
                            }
                            else{
                                r.table('docs').filter({doc_id: delDoc[0].doc_id}).delete().run(dbconn)
                                .then((delResult)=>{
                                    logger.info(`<${className}.delete>: document with doc_id ${doc.doc_id} was deleted`);
                                    callback(null, {msg: 'document deleted', doc_id: delDoc[0].doc_id});
                                }).catch((err)=>{
                                    logger.error(`<${className}.delete>: databse error ${err.message}`);
                                    db.error(err, errcode, callback);
                                });
                            }
                        }).catch((err)=>{
                            logger.error(`<${className}.delete>: database cursor error ${err.message}`);
                            db.error(err, errcode, callback);
                        });
                    }).catch((err)=>{
                        logger.error(`<${className}.delete>: database error ${err.message}`);
                        db.error(err, errcode, callback);
                    });
                }
            }).catch((err)=>{
                logger.error(`<${className}.delete>: get token error`);
                db.error(err, errcode, callback);
            });
        };
    },

    images: function(args, opt, callback){
        let errcode = 1004;
        let {doc_id:doc_id} = args;
        if(!doc_id){
            logger.warn(`<${className}.images>: warn, invalid parameters ${JSON.stringify(args)}`);
            callback(new Error('invalid parameters'));
        }
        else{
            db.read(module.parent.exports.getDBConnection, 
            r.table('images').filter({doc_id: doc_id}), errcode, args, opt, callback);
        }
    },

    change: function(args, opt, callback){
        let errcode = 1005;
        let dbconn = module.parent.exports.getDBConnection();
        let {token:token, doc:doc} = args;
        doc.doc_id = (doc.doc_id == 0) ? "0" : doc.doc_id;
        if(!token || !doc || !doc.doc_id){
            logger.warn(`<${className}.change>: Invalid parameters ${JSON.stringify(args)}`);
            callback(new Error('invalid parameters'));
        }
        else{
            db.checkToken(module.parent.exports.getDBConnection, token).then((key)=>{
                logger.info(`<${className}.change>: get token success`);
                if(key.length === 0){
                    logger.warn(`<${className}.change>: warn bad token`);
                    callback(new Error(`auth error`));
                }
                else{
                    r.table('docs').filter({doc_id: parseInt(doc.doc_id)}).run(dbconn).then((cursor)=>{
                        
                        cursor.toArray().then((resultDoc)=>{
                            if(resultDoc.length === 0){
                                logger.warn(`<${className}.change>: doc not found with doc_id ${doc.doc_id}`);
                                callback(new Error('doc not found'));
                            }
                            else{
                                logger.info(`<${className}.change>: chec do for name success`);
                                if(key[0].access_id < resultDoc[0].access_id){
                                    logger.info(`<${className}.change>: warn, permission denied`);
                                    callback(new Error('permission denied'));
                                }
                                else{
                                    logger.info(`<${className}.change>: permission access`);
                                    r.table('docs').filter({name: doc.name}).run(dbconn).then((cursor)=>{
                                        cursor.toArray().then((checkDoc)=>{
                                            if(checkDoc.length > 0){
                                                logger.warn(`<${className}.change>: warn, doc with name ${doc.name} already exists`);
                                                callback(new Error(`doc with name ${doc.name} already exists`));
                                            }
                                            else{
                                                logger.info(`<${className}.change>: try change doc`);
                                                doc.name = doc.name.trim() || uuid.v4();
                                                checkDoc.name = doc.name;
                                                checkDoc.text = doc.text;
                                                r.table('docs').filter({doc_id: parseInt(doc.doc_id)})
                                                .update({
                                                    name: doc.name,
                                                    text: doc.text
                                                }).run(dbconn).then((result)=>{
                                                    logger.info(`<${className}.change>: change doc success ${JSON.stringify(result)}`);
                                                    callback(null, {msg: 'doc was changed', doc_id: doc.doc_id});
                                                }).catch((err)=>{
                                                    logger.error(`<${className}.change>: change doc error ${err.message}`);
                                                    db.error(err, errcode, callback);
                                                });
                                            }
                                        }).catch((err)=>{
                                            logger.error(`<${className}.change>: check name cursor error ${err.message}`);
                                            db.error(err, errcode, callback);
                                        });
                                    }).catch((err)=>{
                                        logger.error(`<${className}.change>: check name error ${err.message}`);
                                        db.error(err, errcode, callback);
                                    });
                                }
                            }
                        }).catch((err)=>{
                            logger.error(`<${className}.change>: error check doc name ${err.message}`);
                            db.error(err, errcode, callback);
                        });

                    }).catch((err)=>{
                        logger.error(`<${className}.change>: error check doc name ${err.message}`);
                        db.error(err, errcode, callback);
                    });
                }
            }).catch((err)=>{
                logger.error(`<${className}.change>: error change doc ${err.message}`);
                db.error(err, errcode, callback);
            });
        }
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


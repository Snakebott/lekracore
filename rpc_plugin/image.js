
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
        const dbconn = module.parent.exports.getDBConnection;

        function insertNewImage(image, callback){
            r.table('images').insert(image).run(dbconn())
            .then((result)=>{
                logger.info(`<${className}.add>: image was added`);
                callback(null, {state: true, result: result});
            })
            .catch((err)=>{
                logger.error(`<${className}.add>: Error ${err.message}`);
                db.error(err, errcode, callback);
            });
        }

        let errcode = 1305;
        let {token:token, image:image} = args;
        if(!token || !image || !image.doc_id || !image.image || !image.image_info){
            logger.warn(`<${className}.add>: Invalid parameters`);
            logger.debug(`<${className}.add>: ${JSON.stringify(args)}`);
            callback(new Error('Invalid parameters, see doc'));
        }
        else{
            logger.info(`<${className}.add>: Incoming request for add image for doc ID ${image.doc_id}`);
            db.checkToken(dbconn, token).
            then((token)=>{
                if(token.length === 0){
                    logger.warn(`<${className}.add>: user auth error`);
                    callback(new Error(`auth error`));
                }
                else{
                    r.table('docs').filter({doc_id: image.doc_id})
                    .run(dbconn())
                    .then((cursor)=>{
                        cursor.toArray()
                        .then((result)=>{
                            if(result.length === 0){
                                logger.warn(`<${className}.add>: doc with ID ${image.doc_id} not found`);
                                callback(null, `document with doc ID ${image.doc_id} not found`);
                            }
                            else{
                                logger.info(`<${className}.add>: get doc ${image.doc_id} success`);
                                if(token[0].access_id < result[0].access_id){
                                    logger.warn(`<${className}.add>: warn, access denied fro add image`);
                                    callback(new Error(`access denied for this document`));
                                }
                                else if(!image.image_info.file_name || !image.image_info.file_type || !image.image_info.file_size){
                                    logger.warn(`<${className}.add>: bad format file`);
                                    callback(new Error(`bad image file`));
                                }
                                else{
                                    image.access_id = token[0].access_id;
                                    insertNewImage(image, callback);
                                }
                            }
                        })
                        .catch((err)=>{
                            logger.error(`<${className}.add>: Error ${err.message}`);
                            db.error(err, errcode, callback);
                        });
                    })
                    .catch((err)=>{
                        logger.error(`<${className}.add>: Error: ${err.message}`);
                        db.error(err, errcode, callback);
                    });
                }
            })
            .catch((err)=>{
                logger.error(`<${className}.add>: Error ${err.message}`);
                db.error(err, errcode, callback);
            });
        }

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
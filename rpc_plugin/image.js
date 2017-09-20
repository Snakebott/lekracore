
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
        let {image:image} = args;
        let dbconn = module.parent.exports.getDBConnection;
        logger.info(`<${className}.get>: incoming request params: ${JSON.stringify(args)}`);
        try{
            if(typeof(image.image_id) === 'object'){
                logger.debug(`<${className}.get>: image parameters is array`);
                db.read(dbconn, r.table('images').getAll(...image.image_id, {index: 'image_id'}), 
                    errcode, args, opt, callback);
            }
            else if(typeof(image.image_id) === 'number'){
                logger.debug(`<${className}.get>: image parameter is number`);
                db.read(dbconn, r.table('images').filter({image_id: image.image_id}),
                    errcode, args, opt, callback);
            }
            else{
                logger.warn(`<${className}.get>: Warn: Invalid parameters`);
                callback(new Error('invalid parameters, see doc'));
            }
        }
        catch(err){
            logger.debug(err);
            logger.warn(`<${className}.get>: bad request incoming ${JSON.stringify(args)}`);
            callback(new Error(`Bad request: doc_id must be a number, example: {"image_id": 100}`));
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
                                    r.table('images').count().run(dbconn()).then((imgCount)=>{
                                        if(imgCount === 0){
                                            image.image_id = imgCount += 1;
                                            insertNewImage(image, callback);
                                        }
                                        else{
                                            r.table('images').max({index: 'image_id'}).run(dbconn())
                                            .then((lastImage)=>{
                                                image.image_id = lastImage.image_id + 1;
                                                insertNewImage(image, callback);
                                            })
                                            .catch((err)=>{
                                                logger.error(`<${className}.add>: ${err.message}`);
                                                logger.debug(`<${className}.add>: ${err}`);
                                                db.error(err, errcode, callback);
                                            });
                                        }
                                    }).catch((err)=>{
                                        logger.error(`<${className}.add>: ${err.message}`);
                                        logger.debug(`<${className}.add>: ${err}`);
                                        db.error(err, errcode, callback);
                                    });
                                    // insertNewImage(image, callback);
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
        let dbconn = module.parent.exports.getDBConnection;
        let {token:token, image_id:image_id} = args;
        if(!image_id || !token){
            logger.warn(`<${className}.delete>: Invalid parameters`);
            logger.debug(`<${className}.delete>: ${JSON.stringify(args)}`);
            callback(new Error('Invalid parameters, see doc'));
        }
        else{
            logger.info(`<${className}.delete>: incoming request`);
            logger.debug(`<${className}.delete>: ${JSON.stringify(args)}`);
            db.checkToken(dbconn, token).then((tokens)=>{
                logger.debug(`<${className}.delete>: request token success`);
                logger.debug(`<${className}.delete>: ${JSON.stringify(tokens)}`);
                if(tokens.length === 0){
                    logger.warn(`<${className}.delete>: warn, auth error`);
                    callback(new Error('auth error'));
                }
                else{
                    r.table('images').filter({image_id: image_id}).run(dbconn()).then((cursor)=>{
                        cursor.toArray().then((images)=>{
                            if(images.length === 0){
                                logger.warn(`<${className}.delete>: warn - image with id ${image_id} not found`);
                                callback(new Error(`image with id ${image_id} not found`));
                            }
                            else{
                                logger.info(`<${className}.delete>: found image with id ${image_id}`);
                                if(tokens[0].access_id < images[0].access_id){
                                    logger.warn(`<${className}.delete>: warn, access denied`);
                                    callback(new Error('access denied'));
                                }
                                else{
                                    r.table('images').filter({id: images[0].id}).delete().run(dbconn())
                                    .then((result)=>{
                                        logger.info(`<${className}.delete>: image with id: ${image_id} deleted`);
                                        logger.debug(`<${className}.delete>: ${result}`);
                                        callback(null, `deleted: ${JSON.stringify(result)}`);
                                    }).catch((err)=>{
                                        logger.error(`<${className}.delete>: ${err.message}`);
                                        logger.debug(`<${className}.delete>: ${err}`);
                                        db.error(err, errcode, callback);
                                    });
                                }
                                // callback(null, `found image with id ${image_id}`);
                            }
                        }).catch((err)=>{
                            logger.error(`<${className}.delete>: ${err.message}`);
                            logger.debug(`<${className}.delete>: ${err}`);
                            db.error(err, errcode, callback);
                        });
                    }).catch((err)=>{
                        logger.error(`<${className}.delete>: ${err.message}`);
                        logger.debug(`<${className}.delete>: ${JSON.stringify(err)}`);
                    });
                }
            }).catch((err)=>{
                logger.error(`<${className}.delete>: Error: ${err.message}`);
                db.error(err, errcode, callback);
            });
        }
    },

    list: function(args, opt, callback){
        let dbconn = module.parent.exports.getDBConnection;
        let errcode = 1307;
        let {doc:doc} = args;
        try{
            let doc_id = doc.doc_id;
            if(typeof doc_id !== 'number'){
                logger.warn(`<${className}.list>: Warn: doc_id must be a number`)
                callback(new Error('doc_id must be a number'));
            }
            else{
                db.read(dbconn, r.table('images').filter({doc_id: doc_id}), errcode, args, opt, callback);
            }
        }
        catch(err){
            logger.error(`<${className}.list>: Error: ${err.message}`);
            logger.debug(`<${className}.list> ${JSON.stringify(err)}`);
            callback(new Error(`Invalid request, see doc`));
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
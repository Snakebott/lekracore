
const r = require('rethinkdb');
const logger = module.parent.exports.logger;
var config;
var db;
const methods = {

    test: function(args, opt, callback){
        callback(null, config);
    },

    doclist: (args, opt, callback)=>{
        let docList = ['docID', 'docDescription', 'id', 'uploadDate', 'uploader'];
        logger.info(`incoming query id: ${JSON.stringify(args)}`);
        db.query(r.table('docs').without(docList), args, opt, callback);
    },

    doc: function(args, opt, callback){
        try{
            if(typeof(args.docID) !== 'number'){
                logger.debug(`invalid parameter docID: ${JSON.stringify(args)}`);
                callback(new Error(`invalid parameters or docID is not number`));
            }
            else{
                logger.info(`incoming query id: ${opt}`);
                db.query(r.table('docs').filter({docID: args.docID}), args, opt, callback);
            }
        }
        catch(err){
            logger.debug(`invalid parameter: ${JSON.stringify(args)}`);
            callback(new Error(`invalid parameters`));
        }
    },

    docs: function(args, opt, callback){
        let docList  = ['docDescription', 'uploader'];
        logger.info(`incoming query id: ${JSON.stringify(args)}`);
        db.query(r.table('docs').without(['docDescription', 'uploader']), args, opt, callback);
    },

    images: function(args, opt, callback){
        try{
            if(typeof(args.docID) !== 'number'){
                logger.debug(`invalid parameter docID: ${JSON.stringify(args)}`);
                callback(new Error(`invalid parameters or docID is not number`));
            }
            else{
                db.query( r.table('images').filter({docID: args.docID}), args, opt, callback);
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
                db.query(r.db('lekra').table('images').filter({imageID: args.imageID}).without('image'), args, opt, callback);
            }
        }
        catch(err){
            logger.debug(`invalid parameters: ${args}`);
            callback(new Error(`invalid parameters`));
        }
    }
}

function docs(conf){
    config = conf;
    try{
        db = require(`../${config.libDir}/db`);
        db.configure(config);
        return methods;
    }
    catch(err){
        logger.error(err.message);
    }
}

module.exports = docs;


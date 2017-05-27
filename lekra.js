/**
 * Lekrcore application server v1.0.0   (c) by Snakebot
 */

const fs = require('fs');
const config = require('./~config');
const log4js = require('log4js');
const http = require('http');
const rpc = require('json-rpc2');
const r = require('rethinkdb');

var dbconn = {open: false};

function loadPlugin(files){
    if(files.length > 0){
        files.forEach((file)=> {
            try{
                let plugin = require(`${config.rpcServer.pluginDir}/${file}`);
                rpcServer.expose(plugin.name, plugin(config));
                logger.info(`RCP plugin ${plugin.name} was loaded`);
            }
            catch(err){
                logger.error(`Error while loading plugin: ${err.message}`);
                logger.debug(err);
            }
        });
        start();
    }
}

function databaseConnect(){
    r.connect(config.dbconfig.connection, (err, conn)=>{
        if(err){
            logger.error(`could not connect to database: ${err.message}`);
            logger.debug(err);
            logger.info(`try to reconnect to database`);
            setTimeout(databaseConnect, config.dbconfig.reconnectTimeout);
        }
        else{
            logger.info('connected to database');
            dbconn = conn;

            dbconn.once('error', (err)=>{
                logger.error(`database connection error: ${err.message}`);
                logger.debug(err);
                if(!dbconn.open){
                    logger.info('try reconnect to database');
                    setTimeout(databaseConnect, config.dbconfig.reconnectTimeout);
                }
            });

            dbconn.once('close', ()=>{
                logger.warn('database connection closed');
                setTimeout(databaseConnect, config.dbconfig.reconnectTimeout);
            });
        }
    });
}

function start(){
    try{
        if(config.rpcServer.enabled) {
            logger.info(`RCP Server enabled`);
            rpcServer.listen(config.rpcServer.connection.port, config.rpcServer.connection.host);
            logger.info(`RCP Server was started on port ${config.rpcServer.connection.port}`);
        }
        else{
            logger.info(`RCP Server disabled`);
        }

        if(config.webServer.enabled){
            logger.info(`Webserver enabled`);
            webServer.listen(config.webServer.connection);
            logger.info(`Webserver was started on port ${config.webServer.connection.port}`);
        }
        else{
            logger.info(`Webserver disabled`);
        }

        databaseConnect();
        setInterval(()=>{
            logger.debug(`database connection status: ${dbconn.open}`);
        }, config.dbconfig.reconnectTimeout);
        
    }
    catch(err){
        logger.error(`Error starting server: ${err.message}`);
        logger.debug(err);
        throw err;
    }
}

// init logger 
log4js.configure(config.logger);
var logger = log4js.getLogger(config.currentLogger);
logger.setLevel(config.logger.categories.default.level);
module.exports.logger = logger;

//init webserver
let webServer = http.createServer((req, res)=>{
    //pass
});

//init json-rpc2 server
let rpcServer = rpc.Server.$create({
    websocket: true,
    headers: {
        'Access-Controll-Origin-Allow': '*'
    }
});

fs.readdir(config.rpcServer.pluginDir, (err, files)=>{
    if(err){
        logger.error(err.message);
        logger,debug(error);
    }
    else{
        logger.info(`${files.length} plugin found`);
        loadPlugin(files);
    }
});

module.exports.getDBConnection = ()=>{
    return dbconn;
}

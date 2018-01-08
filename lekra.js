/**
 * Lekrcore application server v1.0.0   (c) by Snakebot
 */

const fs = require('fs');
const config = require('./config');
const log4js = require('log4js');
const http = require('http');
const rpc = require('json-rpc2');
const r = require('rethinkdb');

config.webServer.connection.host = process.env['WEBSERVER_HOST'] || config.webServer.connection.host;
config.webServer.connection.port = process.env['WEBSERVER_PORT'] || config.webServer.connection.port;
config.webServer.enabled = process.env['WEBSERVER_ENABLED'] || config.webServer.enabled;
config.webServer.htmlDir = process.env['WEBSSERVER_HTMLDIR'] || config.webServer.htmlDir;

config.rpcServer.connection.host = process.env['RPCSERVER_HOST'] || config.rpcServer.connection.host;
config.rpcServer.connection.port = process.env['RPCSERVER_PORT'] || config.rpcServer.connection.port;
config.rpcServer.enabled = process.env['RPCSERVER_ENABLED'] || config.rpcServer.enabled;
config.rpcServer.pluginDir = process.env['RPCSSERVER_HTMLDIR'] || config.rpcServer.pluginDir;

config.logger.categories.default.level = process.env['LOGGER_LEVEL'] || config.logger.categories.default.level;
config.currentLogger = process.env['LOGGER_CURLOG'] || config.currentLogger;
config.libDir = process.env['LIBDIR'] || config.libDir;

config.dbconfig.connection.host = process.env['DBCONFIG_HOST'] || config.dbconfig.connection.host;
config.dbconfig.connection.port = process.env['DBCONFIG_HOST'] || config.dbconfig.connection.port;
config.dbconfig.connection.user = process.env['DBCONFIG_USER'] || config.dbconfig.connection.user;
config.dbconfig.connection.password = process.env['DBCONFIG_PASSWORD'] || config.dbconfig.connection.password;
config.dbconfig.connection.db = process.env['DBCONFIG_DATABASE'] || config.dbconfig.connection.db;
config.dbconfig.connection.timeout = process.env['DBCONFIG_TIMEOUT'] || config.dbconfig.connection.timeout;
config.dbconfig.reconnectTimeout = process.env['DBCONFIG_RECONNECT'] || config.dbconfig.reconnectTimeout;

var dbconn = {open: false};

// init logger 
log4js.configure(config.logger);
var logger = log4js.getLogger(config.currentLogger);
logger.setLevel(config.logger.categories.default.level);
module.exports.logger = logger;

let rpcServer = rpc.Server.$create({
    websocket: true,
    headers: {
        'Access-Control-Origin-Allow': '*'
    }
});

const loadPlugin = ()=> {
    return new Promise((resolve, reject)=>{
        fs.readdir(config.rpcServer.pluginDir, (err, files)=>{
            if(err){
                logger.debug(err);
                logger.error(`error reading dir. ${err.message}`);
                reject(err);
            } else if(files.length === 0){
                logger.debug(new Error('plugins not found'));
                logger.error(`error: ${files.length} plugins found`);
                reject(new Error('plugins not found'));
            } else {
                logger.info(`${files.length} plugins found`);
                files.forEach((file)=>{
                    try{
                        let plugin = require(`${config.rpcServer.pluginDir}/${file}`);
                        rpcServer.expose(plugin.name, plugin(config));
                        logger.info(`RPC plugin [${plugin.name}] was loaded`);
                    } catch(err){
                        logger.error(`Error while loading plugin: ${err.message}`);
                        logger.debug(err);
                    }
                });
                resolve(files);
            }
        });
    });
}

const databaseConnect = async ()=>{
    try {
        dbconn = await r.connect(config.dbconfig.connection);
        logger.info(`database connected`);
    } catch (err) {
        logger.debug(err);
        logger.error(`Error connect to database: ${err.message}`);
        setTimeout(databaseConnect, config.dbconfig.reconnectTimeout);
        return;
    }

    dbconn.once('error', (err)=>{
        logger.debug(err);
        logger.error(`databse error: ${err.message}`);
        if(!dbconn.open) setTimeout(databaseConnect, config.dbconfig.reconnectTimeout);
    });

    dbconn.once('close', ()=>{
        logger.warn(`database was disconnected, trying reconnect`);
        setTimeout(databaseConnect, config.dbconfig.reconnectTimeout);
    });
}

const start = async ()=>{
    await loadPlugin();
    await databaseConnect();

    try {
        rpcServer.listen(config.rpcServer.connection.port, config.rpcServer.connection.host);
        logger.info(`RPC Server started`);
    } catch (err) {
        logger.debug(err);
        logger.error(`RPC Server not started: ${err.message}`);
        process.exit(1);
    }
}

start();


module.exports.getDBConnection = ()=>{
    return dbconn;
}

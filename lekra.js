/**
 * Lekrcore application server v1.0.0   (c) by Snakebot
 */

const fs = require('fs');
const config = require('./config');
const Snakelog = require('snakelog');
const http = require('http');
const rpc = require('json-rpc2');


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
        if((config.rpcServer.enabled) || (config.webServer.enabled)) console.log(`==== Application Lekra started ====`);
    }
    catch(err){
        logger.error(`Error starting server: ${err.message}`);
        logger.debug(err);
    }
}

// init logger 
var logger = new Snakelog(config.logger);
logger.setLevel(config.level);
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


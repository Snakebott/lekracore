//****** test version script 0.1.0 *******/

const r = require('rethinkdb');
const uuid = require('uuid');
const _ = require('lodash');

const help = "\
    use: \n\
    \t node createdatabse.js <databasefile.js> <host:port> <user> '<password>' <dbname>\n\
    \t user must be admin for create database \
";
var database;
var time = 0;
var timer = setInterval(()=>{
    time += 1;
}, 1000);

function createTable(dbconn, dbname, table){
    return new Promise((resolve, reject)=>{
        r.db(dbname).tableCreate(table).run(dbconn, (err, result)=>{
            if(err) reject(err);
            else {
                console.log(`[OK] \t table ${table} created`);
                resolve(true);
            }
        });
    });
}

function insertData(dbconn, dbname, table, data){
    return new Promise((resolve, reject)=>{
        if(data !== null){
            r.db(dbname).table(table).insert(data).run(dbconn, (err, result)=>{
                if(err) reject(err)
                else{
                    console.log(`[OK] \t insert data into table ${table}`);
                    resolve(true);
                }
            });
        }
        else{
            console.log(`[OK] \t insert data into table ${table} <null>`);
            resolve(true);
        }
    });
}

function usersCreate(dbconn, dbname){
    r.db('rethinkdb').table('users')
    .insert({id: database.dbusers.id, password: database.dbusers.password}).run(dbconn, (err, result)=>{
        if(err) throw err;
        console.log(`users added to database\n`);

        let tablesPromises = _.keys(database.tables).map((table, index)=>{
            return createTable(dbconn, dbname, table);
        });


        Promise.all(tablesPromises).then((result)=>{

            console.log(`\n tables was created\n`);
            let dataPromises = _.keys(database.tables).map((table, index)=>{
                return insertData(dbconn, dbname, table, database.tables[table]);
            });

            Promise.all(dataPromises).then((result)=>{
                clearInterval(timer);
                console.log(`\n --== DATABASE CREATED (in ${time} sec) ==--`);
                dbconn.close();
            }).catch((err)=>{
                console.log(`Error: ${err}`);
                dbconn.close();
            });
            
        }).catch((err)=>{
            console.error(`Error: ${err}`);
            dbconn.close();
        });

    });
}

///
if(process.argv[2] === '--help'){
    console.log(help);
}
else{
    try{
        database = require(`./${process.argv[2]}`);
        let dbname = process.argv[6] || uuid.v4().replace(/-/g, '');
        let opt = {
            host: process.argv[3].split(':')[0] || 'localhost',
            port: process.argv[3].split(':')[1] || 28015,
            user: process.argv[4] || 'admin',
            password: process.argv[5] || ''
        }

        r.connect(opt, (err, conn)=>{
            if(err) throw err;
            r.dbCreate(dbname).run(conn, (err, result)=>{
                if(err) throw err;
                console.log(result);
                console.log('trying create tables...\n');

                conn.on('tablecreated', (result)=>{
                    console.log(`END: ${result} tables was created`);
                    conn.close();
                });

                usersCreate(conn, dbname);
            });
        });
    }
    catch(err){
        console.error(`error: ${err.message}`);
        console.log(help);
    }
}





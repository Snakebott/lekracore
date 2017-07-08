const database = require(`${process.cwd()}/database`);
const r = require('rethinkdb');
const events = require('events');
const config = require(`${process.cwd()}/config`);

const help = `
use:
    parameters: <host> <port> <admin> <password> <db>

    example: node install.js localhost:28015 admin password lekra
    
    example with default parameters: node install.js
    ----
    default host: ${config.dbconfig.connection.host}
    default port: ${config.dbconfig.connection.port}
    default user: admin
    default password: password
    default db: ${config.dbconfig.connection.db}
`

if(process.argv[2] === '--help' || process.argv[2] === 'help'){
    console.log(help);
    process.exit(0);
}

let btnOk =   `[ OK ]\t`;
let btnFail = `[FAIL]\t`;

let timer = 0;

let timeInterval = setInterval(()=>{
    timer += 1;
}, 1000);

class DataSource extends events.EventEmitter{

    
    constructor(param){
        super();
        this.param = param;
        this.dbconn = {open: false}
    }

    open(){
        r.connect(this.param).then((conn)=>{
            this.dbconn = conn;
            this.emit('open', conn);
        }).catch((err)=>{
            this.emit('openerror', err);
        });
    }

    close(){
        try{
            this.dbconn.close();
            this.emit('close');
        }
        catch(err){
            this.emit('closeerror', err);
        }
    }

    dbCreate(dbname){
        r.dbCreate(dbname).run(this.dbconn).then((result)=>{
            this.emit(`createdb`, result);
        }).catch((err)=>{
            this.emit('createdberror', err);
        });
    }

    tableCreate(tables){
        let tablesPromise = [];
        tables.forEach((data, table)=> {
            tablesPromise.push(r.tableCreate(table).run(this.dbconn));
        });
        Promise.all(tablesPromise).then((result)=>{
            this.emit('tablescreate', {result: true});
        }).catch((err)=>{
            err.table = 'All';
            this.emit('tablecreateerror', err);
        });
    }

    insert(tables){
        let tablesPromise = [];
        let tablesIndexes = [];

        tables.forEach((data, table)=>{
            if(data !== null){
                tablesPromise.push(r.table(table).insert(data).run(this.dbconn));
            }
        });

        Promise.all(tablesPromise).then((result)=>{
            this.emit('datainsert', result);
        }).catch((err)=>{
            this.emit('datainserterror', err);
        });
    }

    insertIndex(indexes){
        let tablesIndexes = [];
        indexes.forEach((index, table)=>{
            index.forEach((idx, n)=>{
                tablesIndexes.push(r.table(table).indexCreate(idx).run(this.dbconn));
            });
        });
        Promise.all(tablesIndexes).then((result)=>{
            this.emit('indexcreate', result);
        }).catch((err)=>{
            this.emit('indexcreateerror', err);
        });
    }

    userCreate(user){
        r.db('rethinkdb').table('users').insert({id: user.id, password: config.dbconfig.connection.password}).run(this.dbconn)
        .then((result)=>{
            this.emit('usercreate', result);
        }).catch((err)=>{
            this.emit('usercreateerror', err);
        });
    }

    userGrant(user, grants, db, tables){
        r.grant(user, grants.global).run(this.dbconn).then((result)=>{
            r.db(db).grant(user, grants.local).run(this.dbconn).then((result)=>{
                let tablesPromise = new Array();
                tables.forEach((grant, table)=>{
                    tablesPromise.push(r.db(db).table(table).grant(user, grant).run(this.dbconn));
                });
                Promise.all(tablesPromise).then((result)=>{
                    this.emit('grantuser', result);
                }).catch((err)=>{
                    this.emit('grantusererror', err);
                });
            }).catch((err)=>{
                this.emit('grantusererror', err);
            });
        }).catch((err)=>{
            this.emit('grantusererror', err);
        });
    }
}
//===================================


let [, , host = 'localhost', port= 28015, user = 'admin', password = 'password', db = 'lekra'] = process.argv;
let dbparam = {
    host: host,
    port: port,
    user: user,
    password: password,
    db: db
}

let dataSource = new DataSource(dbparam);
let tables = new Map();
let indexes = new Map();
let tableGrants = new Map();


dataSource.on('open', ()=>{
    console.log(`${btnOk} connected to database`);
    dataSource.dbCreate(dbparam.db);
});

dataSource.on('close', ()=>{
    console.log(`${btnOk} database was closed`);
    clearInterval(timeInterval);
    console.log(`==== complete at ${timer} sec ====`);
});

dataSource.on(`closeerror`, (err)=>{
    console.error(`${btnFail} database close error: ${err.message}`);
    process.exit(1);
});

dataSource.on('openerror', (err)=>{
    console.error(`${btnFail} database open error: ${err.message}`);
    process.exit(1);
});

dataSource.on('createdb', (res)=>{
    console.log(`${btnOk} database created`);
    dataSource.tableCreate(tables);
});

dataSource.on('tablescreate', (res)=>{
    console.log(`${btnOk} tables was created`);
    dataSource.insert(tables);
});


dataSource.on('tablecreateerror', (err)=>{
    console.log(`${btnFail} create table ${err.table} error: ${err.message}`);
});

dataSource.on('tablecreateerror', (err)=>{
    console.error(`${btnFail} create table error: ${err.message}`);
});

dataSource.on('datainsert', (res)=>{
    console.log(`${btnOk} data inserted`);
    dataSource.insertIndex(indexes);
});

dataSource.on('datainserterror', (err)=>{
    console.error(`${btnFail} datainsert error: ${err.message}`);
    process.exit(1)
});

dataSource.on('createdberror', (err)=>{
    console.error(`${btnFail} Error create database: ${err.message}`);
    process.exit(1);
});

dataSource.on('indexcreateerror', (err)=>{
    console.error(`${btnFail} error create index: ${err.message}`);
    process.exit(1);
});

dataSource.on('indexcreate', (res)=>{
    console.log(`${btnOk} indexes created`);
    dataSource.userCreate(database.dbusers);
});

dataSource.on('usercreateerror', (err)=>{
    console.error(`${btnFail} create user error: ${err.message}`);
    process.exit(1);
});

dataSource.on('usercreate', (res)=>{
    console.log(`${btnOk} user ${database.dbusers.id} was created`);
    dataSource.userGrant(database.dbusers.id, database.dbusers.grant, dbparam.db, tableGrants);
});

dataSource.on('grantuser', (res)=>{
    console.log(`${btnOk} user granted`);
    dataSource.close();
});

dataSource.on('grantusererror', (err)=>{
    console.error(`${btnFail} grant user error: ${err.message}`);
    process.exit(1);
});




for(let table in database.tables){
    tables.set(table, database.tables[table]);
}

for(let index in database.indexes){
    indexes.set(index, database.indexes[index]);
}

for(let table in database.dbusers.grant.tables){
    tableGrants.set(table, database.dbusers.grant.tables[table]);
}

console.log('----- Installation database -----\n');
dataSource.open();

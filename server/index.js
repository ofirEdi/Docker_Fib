const keys = require('./keys');
const express = require('express');
const redis = require('redis');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// postgres setup
const {Pool}  = require('pg');

let pool = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort,
    min: 3,
    max: 10,

});

const createTable = async () => {
    let isConnected = false;
    while(!isConnected) {
       try {
           const client = await pool.connect();
           await client.query('CREATE TABLE IF NOT EXISTS values (number INT)').catch((err) => {
            console.log(err);
        });
           client.release();
           isConnected = true;
           console.log('connect to postgres');
       } catch (err) {
           await new Promise((resolve, reject) => {
               setTimeout(() => {
                   resolve();
               }, 2500)
           });
           console.log("trying to connect again");
       } 
    }
};

createTable().then(() => {
    console.log('successfully updated the data base');
})

//Redis Client setup
const redisClient = redis.createClient( {
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => {
        1000
    }
});

const redisPublisher = redisClient.duplicate();

// Express Route handlers
app.get('/', (req, res) => {
    res.send("hello");
})

app.get('/values/all', async(req, res) => {
    let client;
    try {
        client = await pool.connect();
        const values = await client.query('SELECT * FROM values');
        res.status(200).send(values.rows);
    } catch (err) {
        console.log(err);
    } finally {
        client.release();
    }
});

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    })
});

app.post('/values', async(req, res) => {
    const index = req.body.index;
    if(parseInt(index) > 40) {
        res.status(422).send('Index is Too High!');
    }
    let client;
    try {
        redisClient.hset('values', index, 'Nothing yet');
        redisPublisher.publish('insert', index);
        const client = await pool.connect();
        await client.query('INSERT INTO values(number) VALUES($1)', [index]);
        res.send({working: true});
    } catch(err) {
        console.log(err);
    } finally {
        client.release();
    }
});

app.listen(5000, err => {
    console.log("running on port 5000");
})

const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
  ssl: { rejectUnauthorized: false }
});

pgClient.on('connect', (client) => {
  client
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch((err) => console.error(err));
});

// Redis Client Setup
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});

// Manejo de errores de Redis
redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

// Duplicamos la conexión para el publicador
const redisPublisher = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});

// Express route handlers
app.get('/', (req, res) => {
  res.send('Hi');
});

app.get('/values/all', async (req, res) => {
  try {
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
  } catch (err) {
    console.error('Error al obtener valores de PostgreSQL:', err);
    res.status(500).send('Error en el servidor');
  }
});

app.get('/values/current', (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    if (err) {
      console.error('Error al obtener valores de Redis:', err);
      return res.status(500).send('Error en Redis');
    }
    res.send(values);
  });
});

app.post('/values', async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  redisClient.hset('values', index, 'Nothing yet!', (err) => {
    if (err) console.error('Error al guardar en Redis:', err);
  });

  redisPublisher.publish('insert', index, (err) => {
    if (err) console.error('Error al publicar en Redis:', err);
  });

  try {
    await pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
  } catch (err) {
    console.error('Error al insertar en PostgreSQL:', err);
  }

  res.send({ working: true });
});

app.listen(5000, () => {
  console.log('Listening on port 5000');
});

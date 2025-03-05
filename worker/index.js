const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});

// Manejo de errores en Redis
redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

// Duplicamos el cliente para suscribirse a eventos
const sub = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

// Escuchar el canal de Redis y procesar los valores
sub.on('message', (channel, message) => {
  console.log(`Recibido mensaje en canal ${channel}: ${message}`);
  redisClient.hset('values', message, fib(parseInt(message)));
});

// Suscribirse al canal "insert"
sub.subscribe('insert');


// const keys = require('./keys');
// const redis = require('redis');

// const redisClient = redis.createClient({
//   host: keys.redisHost,
//   port: keys.redisPort,
//   retry_strategy: () => 1000,
// });
// const sub = redisClient.duplicate();

// function fib(index) {
//   if (index < 2) return 1;
//   return fib(index - 1) + fib(index - 2);
// }

// sub.on('message', (channel, message) => {
//   redisClient.hset('values', message, fib(parseInt(message)));
// });
// sub.subscribe('insert');

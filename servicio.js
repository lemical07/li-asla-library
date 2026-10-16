import express from 'express';
import 'dotenv/config';

const app = express();
const config = {
    hostname: process.env.DB_HOST,
    port: process.env.SERVER_PORT
};

app.get('/', function(req, res){
    res.send('Hello my dear friend :)')
});

app.listen(config, ()=>{
    console.log(`Servidor corriendo en http://${config.hostname}:${config.port}`)
});
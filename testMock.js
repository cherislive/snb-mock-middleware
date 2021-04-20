import express from 'express';
import path from 'path';
import getMockMiddleware from './src/index.js';

const __dirname = path.resolve(path.dirname(''));
var app = express();
app.use(getMockMiddleware(path.join(__dirname, '/')));

app.listen(3003);
console.log('look in http://localhost:3000/');

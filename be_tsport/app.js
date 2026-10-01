require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'https://t-sport-six.vercel.app'], // URL của front-end và dashboard
    credentials: true // Cho phép gửi cookies và thông tin xác thực
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Phân tích cú pháp dữ liệu từ form
app.use(cookieParser()); // Phân tích cú pháp cookie

app.use(routes);

module.exports = app;

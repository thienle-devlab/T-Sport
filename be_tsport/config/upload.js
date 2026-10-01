const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3');

// Upload ảnh với Tebi
// Cấu hình S3 Client
const s3 = new S3Client({
    region: 'ap-southeast-1',
    endpoint: "https://s3.tebi.io",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    }
});


// Cấu hình multer để sử dụng S3
const uploadTebi = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'images-tsport', // Thay bằng tên bucket của bạn
        acl: 'public-read', // Quyền truy cập vào file (có thể thay đổi theo nhu cầu)
        contentType: multerS3.AUTO_CONTENT_TYPE, // Tự động nhận diện loại content của file
        key: (req, file, cb) => {
            // Đặt tên file dựa trên thời gian để tránh trùng lặp
            cb(null, `product-images/${Date.now()}_${path.basename(file.originalname)}`);
        }
    })
});

module.exports = { s3, uploadTebi };

const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// Lưu file tạm trong memory dưới dạng Buffer
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

const uploadToCloudinary = async (file, folder = 'product-images') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image'
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        stream.end(file.buffer);
    });
};

module.exports = {
    upload,
    uploadToCloudinary
};

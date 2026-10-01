const express = require('express');

const router = express.Router();

const db = require('../connect');

const {
    upload,
    uploadToCloudinary
} = require('../config/upload');

// =====================================================
// API SANPHAM
// =====================================================

// Lấy danh sách sản phẩm
router.get('/data/products', async (req, res) => {
    try {
        const [results] = await db.query(
            'SELECT * FROM SANPHAM ORDER BY RAND()'
        );

        res.json({
            products: results
        });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', err);

        res.status(500).json({
            error: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm'
        });
    }
});


// =====================================================
// Tìm kiếm sản phẩm
// =====================================================

router.get('/data/search/products', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({
            error: 'Query parameter is required'
        });
    }

    try {
        const sql = `
            SELECT *
            FROM SANPHAM
            WHERE TenSanPham LIKE ?
        `;

        const [results] = await db.query(sql, [`%${query}%`]);

        res.json({
            products: results
        });
    } catch (err) {
        console.error('Lỗi khi tìm kiếm sản phẩm:', err);

        res.status(500).json({
            error: 'Đã xảy ra lỗi khi tìm kiếm sản phẩm'
        });
    }
});


// =====================================================
// Thêm sản phẩm
// =====================================================

router.post(
    '/data/create/products',

    upload.fields([
        { name: 'HinhAnhChinh', maxCount: 1 },
        { name: 'AnhChiTiet01', maxCount: 1 },
        { name: 'AnhChiTiet02', maxCount: 1 },
        { name: 'AnhChiTiet03', maxCount: 1 },
        { name: 'AnhChiTiet04', maxCount: 1 }
    ]),

    async (req, res) => {
        try {
            const files = req.files || {};

            // ==========================================
            // Upload từng ảnh lên Cloudinary
            // ==========================================

            const uploadImage = async (fieldName) => {
                if (!files[fieldName] || files[fieldName].length === 0) {
                    return null;
                }

                const result = await uploadToCloudinary(
                    files[fieldName][0],
                    'tsport/products'
                );

                return result.secure_url;
            };

            // Upload 5 ảnh song song
            const [
                hinhAnhChinh,
                anhChiTiet01,
                anhChiTiet02,
                anhChiTiet03,
                anhChiTiet04
            ] = await Promise.all([
                uploadImage('HinhAnhChinh'),
                uploadImage('AnhChiTiet01'),
                uploadImage('AnhChiTiet02'),
                uploadImage('AnhChiTiet03'),
                uploadImage('AnhChiTiet04')
            ]);


            // ==========================================
            // SQL INSERT
            // ==========================================

            const sql = `
                INSERT INTO SANPHAM (
                    MaLoai,
                    TenSanPham,
                    MoTa,
                    HinhAnhChinh,
                    AnhChiTiet01,
                    AnhChiTiet02,
                    AnhChiTiet03,
                    AnhChiTiet04,
                    GiaBan,
                    SoLuong,
                    ThuongHieu
                )
                VALUES (?)
            `;

            const values = [
                req.body.MaLoai,
                req.body.TenSanPham,
                req.body.MoTa,

                hinhAnhChinh,
                anhChiTiet01,
                anhChiTiet02,
                anhChiTiet03,
                anhChiTiet04,

                req.body.GiaBan,
                req.body.SoLuong,
                req.body.ThuongHieu
            ];


            // ==========================================
            // Lưu sản phẩm vào MySQL
            // ==========================================

            const [results] = await db.query(sql, [values]);

            res.status(201).json({
                message: 'Sản phẩm đã được thêm thành công',
                productId: results.insertId
            });

        } catch (err) {
            console.error('Lỗi khi thêm sản phẩm:', err);

            res.status(500).json({
                error: 'Đã xảy ra lỗi khi thêm sản phẩm'
            });
        }
    }
);


// =====================================================
// Cập nhật sản phẩm
// =====================================================

router.put(
    '/data/update/products/:id',

    upload.fields([
        { name: 'HinhAnhChinh', maxCount: 1 },
        { name: 'AnhChiTiet01', maxCount: 1 },
        { name: 'AnhChiTiet02', maxCount: 1 },
        { name: 'AnhChiTiet03', maxCount: 1 },
        { name: 'AnhChiTiet04', maxCount: 1 }
    ]),

    async (req, res) => {
        const productId = req.params.id;

        const {
            MaLoai,
            TenSanPham,
            MoTa,
            GiaBan,
            SoLuong,
            ThuongHieu
        } = req.body;


        // ==========================================
        // Phần UPDATE cơ bản
        // ==========================================

        let updateQuery = `
            UPDATE SANPHAM
            SET
                MaLoai = ?,
                TenSanPham = ?,
                MoTa = ?,
                GiaBan = ?,
                SoLuong = ?,
                ThuongHieu = ?
        `;

        let updateValues = [
            MaLoai,
            TenSanPham,
            MoTa,
            GiaBan,
            SoLuong,
            ThuongHieu
        ];


        try {
            const files = req.files || {};

            console.log('Received files:', Object.keys(files));


            // ==========================================
            // Hàm upload ảnh lên Cloudinary
            // ==========================================

            const uploadImage = async (fieldName) => {
                if (!files[fieldName] || files[fieldName].length === 0) {
                    return null;
                }

                const result = await uploadToCloudinary(
                    files[fieldName][0],
                    'tsport/products'
                );

                return result.secure_url;
            };


            // ==========================================
            // Nếu người dùng upload ảnh mới
            // thì upload ảnh đó lên Cloudinary
            // ==========================================

            if (files.HinhAnhChinh) {
                const imageUrl = await uploadImage('HinhAnhChinh');

                updateQuery += ', HinhAnhChinh = ?';
                updateValues.push(imageUrl);
            }

            if (files.AnhChiTiet01) {
                const imageUrl = await uploadImage('AnhChiTiet01');

                updateQuery += ', AnhChiTiet01 = ?';
                updateValues.push(imageUrl);
            }

            if (files.AnhChiTiet02) {
                const imageUrl = await uploadImage('AnhChiTiet02');

                updateQuery += ', AnhChiTiet02 = ?';
                updateValues.push(imageUrl);
            }

            if (files.AnhChiTiet03) {
                const imageUrl = await uploadImage('AnhChiTiet03');

                updateQuery += ', AnhChiTiet03 = ?';
                updateValues.push(imageUrl);
            }

            if (files.AnhChiTiet04) {
                const imageUrl = await uploadImage('AnhChiTiet04');

                updateQuery += ', AnhChiTiet04 = ?';
                updateValues.push(imageUrl);
            }


            // ==========================================
            // WHERE
            // ==========================================

            updateQuery += ' WHERE MaSanPham = ?';

            updateValues.push(productId);


            console.log('Update Query:', updateQuery);

            // Không nên log toàn bộ updateValues nếu sau này
            // dữ liệu có thông tin nhạy cảm.
            console.log('Product ID:', productId);


            // ==========================================
            // UPDATE DATABASE
            // ==========================================

            const [results] = await db.query(
                updateQuery,
                updateValues
            );


            if (results.affectedRows === 0) {
                return res.status(404).json({
                    error: 'Không tìm thấy sản phẩm để cập nhật'
                });
            }


            res.json({
                message: 'Sản phẩm được cập nhật thành công'
            });

        } catch (err) {
            console.error('Lỗi cập nhật sản phẩm:', err);

            res.status(500).json({
                error: 'Cập nhật sản phẩm thất bại'
            });
        }
    }
);


// =====================================================
// Xóa sản phẩm
// =====================================================

router.delete('/data/delete/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [results] = await db.query(
            'DELETE FROM SANPHAM WHERE MaSanPham = ?',
            [id]
        );

        if (results.affectedRows === 0) {
            return res.status(404).json({
                message: 'Sản phẩm không tồn tại'
            });
        }

        res.json({
            message: 'Sản phẩm đã được xóa thành công'
        });

    } catch (err) {
        console.error('Lỗi khi xóa sản phẩm:', err);

        res.status(500).json({
            error: 'Đã xảy ra lỗi khi xóa sản phẩm'
        });
    }
});


module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../connect');
const { uploadTebi } = require('../config/upload');

// ==> API SANPHAM <==
router.get('/data/products', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM SANPHAM ORDER BY RAND()');
        res.json({ products: results });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm' });
    }
});

//Tìm kiếm sản phẩm
router.get('/data/search/products', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const sql = 'SELECT * FROM SANPHAM WHERE TenSanPham LIKE ?';
        const [results] = await db.query(sql, [`%${query}%`]);

        res.json({ products: results });
    } catch (err) {
        console.error('Lỗi khi tìm kiếm sản phẩm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi tìm kiếm sản phẩm' });
    }
});


router.post('/data/create/products', uploadTebi.fields([
    { name: 'HinhAnhChinh', maxCount: 1 },
    { name: 'AnhChiTiet01', maxCount: 1 },
    { name: 'AnhChiTiet02', maxCount: 1 },
    { name: 'AnhChiTiet03', maxCount: 1 },
    { name: 'AnhChiTiet04', maxCount: 1 }
]), async (req, res) => {
    const sql = "INSERT INTO SANPHAM(`MaLoai`, `TenSanPham`, `MoTa`, `HinhAnhChinh`, `AnhChiTiet01`, `AnhChiTiet02`, `AnhChiTiet03`, `AnhChiTiet04`, `GiaBan`, `SoLuong`, `ThuongHieu`) VALUES(?)"
    const values = [
        req.body.MaLoai,
        req.body.TenSanPham,
        req.body.MoTa,
        req.files.HinhAnhChinh ? req.files.HinhAnhChinh[0].location : null,
        req.files.AnhChiTiet01 ? req.files.AnhChiTiet01[0].location : null,
        req.files.AnhChiTiet02 ? req.files.AnhChiTiet02[0].location : null,
        req.files.AnhChiTiet03 ? req.files.AnhChiTiet03[0].location : null,
        req.files.AnhChiTiet04 ? req.files.AnhChiTiet04[0].location : null,
        req.body.GiaBan,
        req.body.SoLuong,
        req.body.ThuongHieu
    ];

    try {
        const [results] = await db.query(sql, [values]);
        res.status(201).json({ message: 'Sản phẩm đã được thêm thành công', productId: results.insertId });
    } catch (err) {
        console.error('Lỗi khi thêm sản phẩm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi thêm sản phẩm' });
    }
});

router.put('/data/update/products/:id', uploadTebi.fields([
    { name: 'HinhAnhChinh', maxCount: 1 },
    { name: 'AnhChiTiet01', maxCount: 1 },
    { name: 'AnhChiTiet02', maxCount: 1 },
    { name: 'AnhChiTiet03', maxCount: 1 },
    { name: 'AnhChiTiet04', maxCount: 1 }
]), async (req, res) => {
    const productId = req.params.id;
    const { MaLoai, TenSanPham, MoTa, GiaBan, SoLuong, ThuongHieu } = req.body;

    let updateQuery = 'UPDATE SANPHAM SET MaLoai = ?, TenSanPham = ?, MoTa = ?, GiaBan = ?, SoLuong = ?, ThuongHieu = ?';
    let updateValues = [MaLoai, TenSanPham, MoTa, GiaBan, SoLuong, ThuongHieu];

    if (req.files) {
        console.log('Received files:', req.files);
        const { HinhAnhChinh, AnhChiTiet01, AnhChiTiet02, AnhChiTiet03, AnhChiTiet04 } = req.files;
        if (HinhAnhChinh) {
            const hinhAnhChinhPath = HinhAnhChinh[0].location;
            updateQuery += ', HinhAnhChinh = ?';
            updateValues.push(hinhAnhChinhPath);
        }
        if (AnhChiTiet01) {
            const anhChiTiet01Path = AnhChiTiet01[0].location;
            updateQuery += ', AnhChiTiet01 = ?';
            updateValues.push(anhChiTiet01Path);
        }
        if (AnhChiTiet02) {
            const anhChiTiet02Path = AnhChiTiet02[0].location;
            updateQuery += ', AnhChiTiet02 = ?';
            updateValues.push(anhChiTiet02Path);
        }
        if (AnhChiTiet03) {
            const anhChiTiet03Path = AnhChiTiet03[0].location;
            updateQuery += ', AnhChiTiet03 = ?';
            updateValues.push(anhChiTiet03Path);
        }
        if (AnhChiTiet04) {
            const anhChiTiet04Path = AnhChiTiet04[0].location;
            updateQuery += ', AnhChiTiet04 = ?';
            updateValues.push(anhChiTiet04Path);
        }
    }

    updateQuery += ' WHERE MaSanPham = ?';
    updateValues.push(productId);

    console.log('Update Query:', updateQuery);
    console.log('Update Values:', updateValues);


    try {
        const [results] = await db.query(updateQuery, updateValues);
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm để cập nhật' });
        }
        res.json({ message: 'Sản phẩm được cập nhật thành công' });
    } catch (err) {
        console.error('Lỗi cập nhật sản phẩm: ', err);
        res.status(500).json({ error: 'Cập nhật sản phẩm thất bại' });
    }
});

router.delete('/data/delete/products/:id', async (req, res) => {
    const { id } = req.params

    try {
        const [results] = await db.query('DELETE FROM SANPHAM WHERE MaSanPham = ?', [id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }

        res.json({ message: 'Sản phẩm đã được xóa thành công' });
    } catch (err) {
        console.error('Lỗi khi xóa sản phẩm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa sản phẩm' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../connect');

// ==> API MAUSANPHAM <==
router.get('/data/productsample', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM MAUSANPHAM');
        res.json({ productsample: results });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách mẫu sản phẩm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách mẫu sản phẩm' });
    }
});

router.post('/data/create/productsample', async (req, res) => {
    const data = req.body
    const fields = [];
    const values = [];
    const placeholders = [];

    for (let key in data) {
        fields.push(key);
        values.push(data[key]);
        placeholders.push('?');
    }

    const sql = `INSERT INTO MAUSANPHAM (${fields.join(',')}) VALUES (${placeholders.join(',')})`;

    try {
        const [results] = await db.query(sql, values);
        res.status(201).json({ message: 'Mẫu sản phẩm đã được thêm thành công', productsampleId: results.insertId });
    } catch (error) {
        console.error('Lỗi thêm mẫu sản phẩm: ', error);
        res.status(500).json({ error: 'Thêm mẫu sản phẩm thất bại' });
    }
})

router.put('/data/update/productsample/:id', async (req, res) => {
    const { id } = req.params
    const data = req.body

    // Tạo câu lệnh SQL động
    let updateFields = [];
    let values = [];

    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            updateFields.push(`${key} = ?`);
            values.push(data[key]);
        }
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });
    }

    const sql = `UPDATE MAUSANPHAM SET ${updateFields.join(', ')} WHERE MaMau = ?`;
    values.push(id);

    try {
        const [results] = await db.query(sql, values);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Mẫu sản phẩm không tồn tại' });
        }

        res.json({ message: 'Mẫu sản phẩm đã được cập nhật thành công', updatedProductSample: req.body });
    } catch (err) {
        console.error('Lỗi khi cập nhật mẫu sản phẩm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật mẫu sản phẩm' });
    }
})

router.delete('/data/delete/productsample/:id', async (req, res) => {
    const { id } = req.params

    try {
        const [results] = await db.query('DELETE FROM MAUSANPHAM WHERE MaMau = ?', [id]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Mẫu sản phẩm không tồn tại' });
        }

        res.json({ message: 'Mẫu sản phẩm đã được xóa thành công' });
    } catch (err) {
        console.error('Lỗi khi xóa mẫu sản phẩm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa mẫu sản phẩm' });
    }
})

module.exports = router;

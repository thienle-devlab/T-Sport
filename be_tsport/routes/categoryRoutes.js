const express = require('express');
const router = express.Router();
const db = require('../connect');

// ==> API LOAISANPHAM <==
router.get('/data/categories', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM LOAISANPHAM');
        res.json({ categories: results });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách loại sản phẩm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách loại sản phẩm' });
    }
});

router.post('/data/create/categories', async (req, res) => {
    const data = req.body
    const fields = [];
    const values = [];
    const placeholders = [];

    for (let key in data) {
        fields.push(key);
        values.push(data[key]);
        placeholders.push('?');
    }
    const sql = `INSERT INTO LOAISANPHAM (${fields.join(',')}) VALUES (${placeholders.join(',')})`;
    try {
        const [results] = await db.query(sql, values);
        res.status(201).json({ message: 'Loại sản phẩm đã được thêm thành công', categoryId: results.insertId });
    } catch (error) {
        console.error('Lỗi thêm loại sản phẩm: ', error);
        res.status(500).json({ error: 'Thêm loại sản phẩm thất bại' });
    }
})

router.put('/data/update/categories/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;

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

    // Tạo câu lệnh SQL
    const sql = `UPDATE LOAISANPHAM SET ${updateFields.join(', ')} WHERE MaLoai = ?`;
    
    // Thêm id vào cuối mảng values
    values.push(id);

    try {
        const [results] = await db.query(sql, values);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Loại sản phẩm không tồn tại' });
        }

        res.json({ message: 'Loại sản phẩm đã được cập nhật thành công', updatedCategory: req.body });
    } catch (err) {
        console.error('Lỗi khi cập nhật loại sản phẩm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật loại sản phẩm', details: err.message });
    }
});

router.delete('/data/delete/categories/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Received delete request for category ID:', id);

    try {
        // Kiểm tra xem loại sản phẩm có tồn tại không
        const [checkResult] = await db.query('SELECT MaLoai FROM LOAISANPHAM WHERE MaLoai = ?', [id]);

        if (checkResult.length === 0) {
            return res.status(404).json({ message: 'Loại sản phẩm không tồn tại' });
        }

        // Nếu tồn tại, tiến hành xóa
        const [deleteResult] = await db.query('DELETE FROM LOAISANPHAM WHERE MaLoai = ?', [id]);

        if (deleteResult.affectedRows === 0) {
            // Trường hợp này hiếm khi xảy ra vì chúng ta đã kiểm tra sự tồn tại trước đó
            return res.status(500).json({ message: 'Không thể xóa loại sản phẩm' });
        }

        res.json({ message: 'Loại sản phẩm đã được xóa thành công' });
    } catch (err) {
        console.error('Lỗi khi xóa loại sản phẩm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa loại sản phẩm', details: err.message });
    }
});

module.exports = router;

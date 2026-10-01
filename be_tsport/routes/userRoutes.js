const express = require('express');
const router = express.Router();
const db = require('../connect');

// ==> API NGUOIDUNG <==
router.get('/data/users', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM NGUOIDUNG');
        res.json({ users: results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/data/create/users', async (req, res) => {
    const data = req.body;
    const fields = [];
    const values = [];
    const placeholders = [];

    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            fields.push(key);
            values.push(data[key]);
            placeholders.push('?');
        }
    }

    const sql = `INSERT INTO NGUOIDUNG (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;

    try {
        const [results] = await db.query(sql, values);
        // Gửi phản hồi thành công
        res.status(201).json({ message: 'Người dùng đã được thêm thành công', usersId: results.insertId }); //results.insertId  là ID tự động tăng (auto-increment ID) của hàng mới được chèn vào cơ sở dữ liệu.
    } catch (error) {
        // Xử lý lỗi và gửi phản hồi lỗi
        console.error('Lỗi khi thêm người dùng:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm người dùng', error: error.message });
    }

});

router.put('/data/update/users/:id', async (req, res) => {
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

    const sql = `UPDATE NGUOIDUNG SET ${updateFields.join(', ')} WHERE MaNguoiDung = ?`;
    values.push(id);

    try {
        const [results] = await db.query(sql, values);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        res.json({ message: 'Người dùng đã được cập nhật thành công', updatedCustomer: req.body });
    } catch (err) {
        console.error('Lỗi khi cập nhật người dùng:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật người dùng' });
    }
})

router.delete('/data/delete/users/:id', async (req, res) => {
    const { id } = req.params

    try {
        // Bắt đầu transaction
        await db.query('START TRANSACTION');

        // Xóa các hàng liên quan trong bảng DONHANG trước
        await db.query('DELETE FROM DONHANG WHERE MaNguoiDung = ?', [id]);

        // Sau đó xóa người dùng từ bảng NGUOIDUNG
        const [results] = await db.query('DELETE FROM NGUOIDUNG WHERE MaNguoiDung = ?', [id]);

        if (results.affectedRows === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Commit transaction nếu mọi thứ thành công
        await db.query('COMMIT');

        res.json({ message: 'Người dùng đã được xóa thành công' });
    } catch (err) {
        // Rollback transaction nếu có lỗi
        await db.query('ROLLBACK');
        console.error('Lỗi khi xóa người dùng:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa người dùng' });
    }
})

module.exports = router;

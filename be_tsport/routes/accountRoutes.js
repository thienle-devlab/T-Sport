const express = require('express');
const router = express.Router();
const db = require('../connect');

router.get('/data/accounts', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM TAIKHOAN');
        res.json({ accounts: results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/data/update/accounts/:id', async (req, res) => {
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

    const sql = `UPDATE TAIKHOAN SET ${updateFields.join(', ')} WHERE MaTaiKhoan = ?`;
    values.push(id);

    try {
        const [results] = await db.query(sql, values);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Tài khoản không tồn tại' });
        }
        res.json({ message: 'Tài khoản đã được cập nhật thành công', updatedAccounts: req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../connect');

// ==> API DONHANG <==
router.get('/data/order', (req, res) => {
    db.query('SELECT * FROM DONHANG', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ order: results });
    });
});

router.post('/data/create/order', async (req, res) => {
    const data = req.body
    const fields = [];
    const values = [];
    const placeholders = [];

    for (let key in data) {
        fields.push(key);
        values.push(data[key]);
        placeholders.push('?');
    }
    const sql = `INSERT INTO DONHANG (${fields.join(',')}) VALUES (${placeholders.join(',')})`;
    try {
        const results = await new Promise((resolve, reject) => {
            db.query(sql, values, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        res.status(201).json({ message: 'Đơn hàng đã được thêm thành công', orderId: results.insertId });
    } catch (error) {
        console.error('Lỗi thêm đơn hàng: ', error);
        res.status(500).json({ error: 'Thêm đơn hàng thất bại' });
    }
})

router.put('/data/update/order/:id', async (req, res) => {
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

    const sql = `UPDATE DONHANG SET ${updateFields.join(', ')} WHERE MaDonHang = ?`;
    values.push(id);

    db.query(sql, values, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }
        res.json({ message: 'Đơn hàng đã được cập nhật thành công', updatedOrder: req.body });
    });
})

router.delete('/data/delete/order/:id', (req, res) => {
    const { id } = req.params

    db.query('DELETE FROM DONHANG WHERE MaDonHang = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }
        res.json({ message: 'Đơn hàng đã được xóa thành công' });
    });
})

// ==> API CHITIETDONHANG <==
router.get('/data/order-detail', (req, res) => {
    db.query('SELECT * FROM CHITIETDONHANG', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ orderDetail: results });
    });
});

router.post('/data/create/order-detail', async (req, res) => {
    const data = req.body
    const fields = [];
    const values = [];
    const placeholders = [];

    for (let key in data) {
        fields.push(key);
        values.push(data[key]);
        placeholders.push('?');
    }
    const sql = `INSERT INTO CHITIETDONHANG (${fields.join(',')}) VALUES (${placeholders.join(',')})`;
    try {
        const results = await new Promise((resolve, reject) => {
            db.query(sql, values, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        res.status(201).json({ message: 'Chi tiết đơn hàng đã được thêm thành công', orderDetailId: results.insertId });
    } catch (error) {
        console.error('Lỗi thêm chi tiết đơn hàng: ', error);
        res.status(500).json({ error: 'Thêm chi tiết đơn hàng thất bại' });
    }
})

router.put('/data/update/order-detail/:id', async (req, res) => {
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

    const sql = `UPDATE CHITIETDONHANG SET ${updateFields.join(', ')} WHERE MaChiTietDonHang = ?`;
    values.push(id);

    db.query(sql, values, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Chi tiết đơn hàng không tồn tại' });
        }
        res.json({ message: 'Chi tiết đơn hàng đã được cập nhật thành công', updatedOrderDetial: req.body });
    });
})

router.delete('/data/delete/order-detail/:id', (req, res) => {
    const { id } = req.params

    db.query('DELETE FROM CHITIETDONHANG WHERE MaChiTietDonHang = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Chi tiết đơn hàng không tồn tại' });
        }
        res.json({ message: 'Chi tiết đơn hàng đã được xóa thành công' });
    });
})

module.exports = router;

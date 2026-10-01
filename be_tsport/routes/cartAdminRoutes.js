const express = require('express');
const router = express.Router();
const db = require('../connect');

// ==> API GIOHANG <==
router.get('/data/cart', (req, res) => {
    db.query('SELECT * FROM GIOHANG', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ cart: results });
    });
});

router.post('/data/create/cart', async (req, res) => {
    const data = req.body
    const fields = [];
    const values = [];
    const placeholders = [];

    for (let key in data) {
        fields.push(key);
        values.push(data[key]);
        placeholders.push('?');
    }
    const sql = `INSERT INTO GIOHANG (${fields.join(',')}) VALUES (${placeholders.join(',')})`;
    try {
        const results = await new Promise((resolve, reject) => {
            db.query(sql, values, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        res.status(201).json({ message: 'Giỏ hàng đã được thêm thành công', cartId: results.insertId });
    } catch (error) {
        console.error('Lỗi thêm giỏ hàng: ', error);
        res.status(500).json({ error: 'Thêm giỏ hàng thất bại' });
    }
})

router.put('/data/update/cart/:id', async (req, res) => {
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

    const sql = `UPDATE GIOHANG SET ${updateFields.join(', ')} WHERE ID = ?`;
    values.push(id);

    db.query(sql, values, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
        }
        res.json({ message: 'Giỏ hàng đã được cập nhật thành công', updatedCart: req.body });
    });
})

router.delete('/data/delete/cart/:id', (req, res) => {
    const { id } = req.params

    db.query('DELETE FROM GIOHANG WHERE ID = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
        }
        res.json({ message: 'Giỏ hàng đã được xóa thành công' });
    });
})


// ==> API MUCGIOHANG <==
router.get('/data/cart-item', (req, res) => {
    db.query('SELECT * FROM MUCGIOHANG', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ cartItem: results });
    });
});

router.post('/data/create/cart-item', async (req, res) => {
    const { userID, productID, quantity, price } = req.body;

    try {
        db.beginTransaction(async err => {
            if (err) {
                throw err;
            }

            // Kiểm tra xem giỏ hàng có tồn tại cho người dùng chưa
            const cartQuery = 'SELECT * FROM GIOHANG WHERE MaNguoiDung = ? AND isActive = 1';
            db.query(cartQuery, [userID], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }

                let cartID = results.length > 0 ? results[0].MaGioHang : null;

                if (!cartID) {
                    // Tạo mới giỏ hàng nếu chưa tồn tại
                    const createCartQuery = 'INSERT INTO GIOHANG (MaNguoiDung) VALUES (?)';
                    db.query(createCartQuery, [userID], (err, result) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: err.message });
                            });
                        }

                        cartID = result.insertId;
                        addOrUpdateCartItem(cartID, productID, quantity, price, res);
                    });
                } else {
                    addOrUpdateCartItem(cartID, productID, quantity, price, res);
                }
            });
        });
    } catch (error) {
        console.error('Lỗi thêm mục giỏ hàng: ', error);
        res.status(500).json({ error: 'Thêm mục giỏ hàng thất bại' });
    }
});

const addOrUpdateCartItem = (cartID, productsampleID, quantity, price, res) => {
    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const checkCartItemQuery = 'SELECT * FROM MUCGIOHANG WHERE IdGioHang = ? AND MaMau = ?';
    db.query(checkCartItemQuery, [cartID, productsampleID], (err, results) => {
        if (err) {
            return db.rollback(() => {
                res.status(500).json({ error: err.message });
            });
        }

        if (results.length > 0) {
            // Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
            const updateCartItemQuery = 'UPDATE MUCGIOHANG SET SoLuong = ? WHERE IdGioHang = ? AND MaMau = ?';
            db.query(updateCartItemQuery, [quantity, cartID, productsampleID], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }

                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    }

                    res.status(200).json({ message: 'Cập nhật sản phẩm trong giỏ hàng thành công' });
                });
            });
        } else {
            // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới sản phẩm
            const addCartItemQuery = 'INSERT INTO MUCGIOHANG (IdGioHang, MaMau, SoLuongSanPham, TongGiaSanPham) VALUES (?, ?, ?, ?)';
            db.query(addCartItemQuery, [cartID, productsampleID, quantity, price], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }

                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    }

                    res.status(201).json({ message: 'Thêm sản phẩm vào giỏ hàng thành công' });
                });
            });
        }
    });
};

router.put('/data/update/cart-item/:id', async (req, res) => {
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

    const sql = `UPDATE MUCGIOHANG SET ${updateFields.join(', ')} WHERE MaMucGioHang = ?`;
    values.push(id);

    db.query(sql, values, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Mục giỏ hàng không tồn tại' });
        }
        res.json({ message: 'Mục giỏ hàng đã được cập nhật thành công', updatedCartItem: req.body });
    });
})

router.delete('/data/delete/cart-item/:id', (req, res) => {
    const { id } = req.params

    db.query('DELETE FROM MUCGIOHANG WHERE MaMucGioHang = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Mục giỏ hàng không tồn tại' });
        }
        res.json({ message: 'Mục giỏ hàng đã được xóa thành công' });
    });
})

module.exports = router;

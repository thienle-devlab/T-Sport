const express = require('express');
const router = express.Router();
const db = require('../connect');
const authenticateToken = require('../authMiddleware');

// Lấy giỏ hàng của người dùng
// ** Route cho giỏ hàng **
router.get('/api/cart', authenticateToken, async (req, res) => {
    const MaNguoiDung = req.user.MaNguoiDung;

    try {
        const [cartItems] = await db.query(`
             SELECT 
                MucGioHang.*, 
                SanPham.MaSanPham,
                SanPham.TenSanPham, 
                SanPham.HinhAnhChinh, 
                SanPham.GiaBan,
                MauSanPham.MauSac,
                MauSanPham.KichThuoc,
                MauSanPham.KieuDang
            FROM GioHang
            JOIN MucGioHang ON GioHang.ID = MucGioHang.IdGioHang
            JOIN MauSanPham ON MucGioHang.MaMau = MauSanPham.MaMau
            JOIN SanPham ON MauSanPham.MaSanPham = SanPham.MaSanPham
            WHERE GioHang.MaNguoiDung = ? AND MucGioHang.TrangThai = 'Chưa mua'
        `, [MaNguoiDung]);

        res.json(cartItems);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin giỏ hàng:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thông tin giỏ hàng' });
    }
});

// Thêm sản phẩm vào giỏ hàng
router.post('/api/cart/add', authenticateToken, async (req, res) => {
    const { MaMau, SoLuongSanPham, TongGiaSanPham } = req.body;
    const MaNguoiDung = req.user.MaNguoiDung;

    try {
        await db.query('START TRANSACTION');

        // Kiểm tra xem người dùng đã có giỏ hàng chưa
        let [existingCart] = await db.query(
            'SELECT ID FROM GioHang WHERE MaNguoiDung = ?',
            [MaNguoiDung]
        );

        let cartId;
        if (existingCart.length === 0) {
            // Nếu chưa có giỏ hàng, tạo mới
            const [newCart] = await db.query(
                'INSERT INTO GioHang (MaNguoiDung, GiaTriGioHang) VALUES (?, 0)',
                [MaNguoiDung]
            );
            cartId = newCart.insertId;
        } else {
            cartId = existingCart[0].ID;
        }

        // Kiểm tra xem sản phẩm đã có trong mục giỏ hàng chưa
        const [existingItem] = await db.query(
            'SELECT * FROM MucGioHang WHERE IdGioHang = ? AND MaMau = ? AND TrangThai = "Chưa mua"',
            [cartId, MaMau]
        );

        if (existingItem.length > 0) {
            // Nếu sản phẩm đã tồn tại, cập nhật số lượng và tổng giá
            await db.query(
                'UPDATE MucGioHang SET SoLuongSanPham = SoLuongSanPham + ?, TongGiaSanPham = TongGiaSanPham + ? WHERE IdGioHang = ? AND MaMau = ? AND TrangThai = "Chưa mua"',
                [SoLuongSanPham, TongGiaSanPham, cartId, MaMau]
            );
        } else {
            // Nếu sản phẩm chưa tồn tại, thêm mới vào mục giỏ hàng
            await db.query(
                'INSERT INTO MucGioHang (IdGioHang, MaMau, SoLuongSanPham, TongGiaSanPham, TrangThai) VALUES (?, ?, ?, ?, "Chưa mua")',
                [cartId, MaMau, SoLuongSanPham, TongGiaSanPham]
            );
        }

        // Cập nhật tổng giá trị giỏ hàng
        await db.query(
            'UPDATE GioHang SET GiaTriGioHang = (SELECT IFNULL(SUM(TongGiaSanPham), 0) FROM MucGioHang WHERE IdGioHang = ? AND TrangThai = "Chưa mua") WHERE ID = ?',
            [cartId, cartId]
        );

        await db.query('COMMIT');
        res.status(200).json({ message: 'Sản phẩm đã được thêm vào giỏ hàng' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng', details: error.message });
    }
});

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/api/cart/update-quantity', authenticateToken, async (req, res) => {
    const { MaMucGioHang, SoLuongSanPham, isSelected } = req.body;
    const MaNguoiDung = req.user.MaNguoiDung;
  
    console.log('Received data:', { MaMucGioHang, SoLuongSanPham, isSelected, MaNguoiDung });
  
    if (!MaMucGioHang || SoLuongSanPham === undefined || SoLuongSanPham < 0) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
  
    try {
      await db.query('START TRANSACTION');
  
      // 1. Cập nhật số lượng và tổng giá của sản phẩm trong MUCGIOHANG
      const updateMucGioHangQuery = `
        UPDATE MUCGIOHANG m
        JOIN GIOHANG g ON m.IdGioHang = g.ID
        JOIN MAUSANPHAM ms ON m.MaMau = ms.MaMau
        JOIN SANPHAM s ON ms.MaSanPham = s.MaSanPham
        SET m.SoLuongSanPham = ?,
            m.TongGiaSanPham = s.GiaBan * ?,
            m.isSelected = ?
        WHERE m.MaMucGioHang = ? AND g.MaNguoiDung = ?
      `;
      const [updateResult] = await db.query(updateMucGioHangQuery, [SoLuongSanPham, SoLuongSanPham, isSelected, MaMucGioHang, MaNguoiDung]);
  
      if (updateResult.affectedRows === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
      }
  
      // 2. Cập nhật tổng giá trị của giỏ hàng
      const updateGioHangQuery = `
        UPDATE GIOHANG g
        SET g.GiaTriGioHang = (
          SELECT SUM(m.TongGiaSanPham)
          FROM MUCGIOHANG m
          WHERE m.IdGioHang = g.ID AND m.isSelected = TRUE
        )
        WHERE g.MaNguoiDung = ?
      `;
      await db.query(updateGioHangQuery, [MaNguoiDung]);
  
      // 3. Lấy thông tin cập nhật của sản phẩm
      const getUpdatedItemQuery = `
        SELECT m.*, s.TenSanPham, s.GiaBan, ms.MauSac, ms.KichThuoc
        FROM MUCGIOHANG m
        JOIN GIOHANG g ON m.IdGioHang = g.ID
        JOIN MAUSANPHAM ms ON m.MaMau = ms.MaMau
        JOIN SANPHAM s ON ms.MaSanPham = s.MaSanPham
        WHERE m.MaMucGioHang = ? AND g.MaNguoiDung = ?
      `;
      const [updatedItems] = await db.query(getUpdatedItemQuery, [MaMucGioHang, MaNguoiDung]);
  
      // 4. Lấy tổng giá trị mới của giỏ hàng
      const [gioHangResult] = await db.query('SELECT GiaTriGioHang FROM GIOHANG WHERE MaNguoiDung = ?', [MaNguoiDung]);
  
      await db.query('COMMIT');
  
      res.json({
        message: 'Số lượng đã được cập nhật',
        updatedItem: updatedItems[0],
        newTotalCartValue: gioHangResult[0].GiaTriGioHang
      });
  
    } catch (err) {
      console.error('Lỗi khi cập nhật số lượng:', err);
      await db.query('ROLLBACK');
      res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật số lượng', details: err.message });
    }
  });

// Xóa Sản Phẩm Khỏi Giỏ Hàng
router.delete('/api/cart/remove-item', authenticateToken, async (req, res) => {
  const { MaMucGioHang } = req.body;
  const MaNguoiDung = req.user.MaNguoiDung;

  console.log('Removing item:', { MaMucGioHang, MaNguoiDung });

  if (!MaMucGioHang) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
  }

  try {
    await db.query('START TRANSACTION');

    // 1. Xóa mục khỏi MUCGIOHANG
    const deleteQuery = `
      DELETE m FROM MUCGIOHANG m
      JOIN GIOHANG g ON m.IdGioHang = g.ID
      WHERE m.MaMucGioHang = ? AND g.MaNguoiDung = ?
    `;
    const [deleteResult] = await db.query(deleteQuery, [MaMucGioHang, MaNguoiDung]);

    if (deleteResult.affectedRows === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    // 2. Cập nhật tổng giá trị của giỏ hàng
    const updateGioHangQuery = `
      UPDATE GIOHANG g
      SET g.GiaTriGioHang = (
        SELECT COALESCE(SUM(m.TongGiaSanPham), 0)
        FROM MUCGIOHANG m
        WHERE m.IdGioHang = g.ID
      )
      WHERE g.MaNguoiDung = ?
    `;
    await db.query(updateGioHangQuery, [MaNguoiDung]);

    // 3. Lấy tổng giá trị mới của giỏ hàng
    const [gioHangResult] = await db.query('SELECT GiaTriGioHang FROM GIOHANG WHERE MaNguoiDung = ?', [MaNguoiDung]);

    await db.query('COMMIT');

    res.json({
      message: 'Sản phẩm đã được xóa khỏi giỏ hàng',
      newTotalCartValue: gioHangResult[0].GiaTriGioHang
    });

  } catch (err) {
    console.error('Lỗi khi xóa sản phẩm:', err);
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa sản phẩm', details: err.message });
  }
});

module.exports = router;

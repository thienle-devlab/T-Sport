const express = require('express');
const router = express.Router();
const db = require('../connect');
const authenticateToken = require('../authMiddleware');

// ==> API BÌNH LUẬN ĐÁNH GIÁ <==
// Lấy thông tin bình luận đánh giá
router.get('/api/reviews/:productId', authenticateToken, async (req, res) => {
    const MaSanPham = req.params.productId;

    try {
        const [reviews] = await db.query(`
            SELECT 
                BINHLUAN.MaBinhLuan, 
                BINHLUAN.NoiDung, 
                BINHLUAN.NgayBinhLuan, 
                BINHLUAN.MaNguoiDung, 
                DANHGIA.SoSao,
                NGUOIDUNG.TenNguoiDung
            FROM BINHLUAN
            LEFT JOIN DANHGIA ON BINHLUAN.MaDanhGia = DANHGIA.MaDanhGia
            JOIN NGUOIDUNG ON BINHLUAN.MaNguoiDung = NGUOIDUNG.MaNguoiDung
            WHERE BINHLUAN.MaSanPham = ?
        `, [MaSanPham]);

        res.json(reviews);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin bình luận và đánh giá:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thông tin bình luận và đánh giá' });
    }
});

// Lưu thông tin bình luận đánh giá
router.post('/api/save/reviews', authenticateToken, async (req, res) => {
    const MaNguoiDung = req.user.MaNguoiDung;
    const { MaSanPham, NoiDung, SoSao } = req.body;
  
    // Lấy ngày hiện tại
    const currentDate = new Date();
    const NgayDanhGia = currentDate.toISOString().split('T')[0]; // Định dạng YYYY-MM-DD
    const NgayBinhLuan = currentDate.toISOString().split('T')[0]; // Định dạng YYYY-MM-DD
  
    try {
      console.log('Dữ liệu nhận được từ client:', {
        MaSanPham, NoiDung, NgayBinhLuan, NgayDanhGia, SoSao
      });
  
      await db.query('START TRANSACTION');
  
      // Lưu đánh giá và lấy MaDanhGia
      const [result] = await db.query(`
        INSERT INTO DANHGIA (MaSanPham, MaNguoiDung, NgayDanhGia, SoSao)
        VALUES (?, ?, ?, ?)
      `, [MaSanPham, MaNguoiDung, NgayDanhGia, SoSao]);
  
      const MaDanhGia = result.insertId; // Lấy ID của đánh giá vừa được thêm
      console.log('MaDanhGia:', MaDanhGia);
  
      // Lưu bình luận với MaDanhGia
      await db.query(`
        INSERT INTO BINHLUAN (MaSanPham, MaNguoiDung, NgayBinhLuan, NoiDung, MaDanhGia)
        VALUES (?, ?, ?, ?, ?)
      `, [MaSanPham, MaNguoiDung, NgayBinhLuan, NoiDung, MaDanhGia]);
  
      await db.query('COMMIT');
      res.status(201).json({ message: 'Bình luận và đánh giá đã được thêm thành công' });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Lỗi khi lưu bình luận và đánh giá:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi lưu bình luận và đánh giá' });
    }
  });

module.exports = router;

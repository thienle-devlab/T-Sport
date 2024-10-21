require('dotenv').config();
const express = require('express')
const db = require('./connect');
// const mysql = require('mysql2/promise')
const bodyParser = require('body-parser')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const authenticateToken = require('./authMiddleware');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');

const app = express()
const port = 3001

app.use(cors(
    {
        origin: ['http://localhost:3000', 'http://localhost:3002'], // URL của ứng dụng front-end và dashboard
        credentials: true // Cho phép gửi cookies và thông tin xác thực
    }
))
app.use(bodyParser.json())
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true })); // Phân tích cú pháp dữ liệu từ form
app.use(cookieParser()); // Phân tích cú pháp cookie
// app.use(express.static('public')); // Phục vụ file tĩnh
console.log('Current SECRET_KEY:', process.env.SECRET_KEY);
// const secretKey = uuidv4(); // Tạo UUID
// console.log(secretKey);



// const db = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// // Kiểm tra kết nối
// async function testConnection() {
//     try {
//       const connection = await db.getConnection();
//       console.log('Kết nối thành công đến CSDL');
//       connection.release();
//     } catch (error) {
//       console.error('Lỗi kết nối đến CSDL:', error);
//     }
//   }

// Cấu hình lưu trữ cho multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../fe_tsport/public/images') // Thư mục để lưu trữ file
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname)) // Tên file sẽ lưu trữ
    }
})

// Lấy giỏ hàng của người dùng
// ** Route cho giỏ hàng **
app.get('/api/cart', authenticateToken, async (req, res) => {
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
app.post('/api/cart/add', authenticateToken, async (req, res) => {
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
            'UPDATE GioHang SET GiaTriGioHang = (SELECT SUM(TongGiaSanPham) FROM MucGioHang WHERE IdGioHang = ? AND TrangThai = "Chưa mua") WHERE ID = ?',
            [TongGiaSanPham, cartId]
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
app.put('/api/cart/update-quantity', authenticateToken, async (req, res) => {
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
app.delete('/api/cart/remove-item', authenticateToken, async (req, res) => {
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

// ==> API BÌNH LUẬN ĐÁNH GIÁ <==
// Lấy thông tin bình luận đánh giá
app.get('/api/reviews/:productId', authenticateToken, async (req, res) => {
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
app.post('/api/save/reviews', authenticateToken, async (req, res) => {
    const MaNguoiDung = req.user.MaNguoiDung;
    const { MaSanPham, NoiDung, SoSao } = req.body;
  
    try {
      await db.query('START TRANSACTION');
  
      // Lưu đánh giá và lấy MaDanhGia
      const [result] = await db.query(`
        INSERT INTO DANHGIA (MaSanPham, MaNguoiDung, SoSao)
        VALUES (?, ?, ?)
      `, [MaSanPham, MaNguoiDung, SoSao]);
  
      const MaDanhGia = result.insertId; // Lấy ID của đánh giá vừa được thêm
  
      // Lưu bình luận với MaDanhGia
      await db.query(`
        INSERT INTO BINHLUAN (MaSanPham, MaNguoiDung, NoiDung, MaDanhGia)
        VALUES (?, ?, ?, ?)
      `, [MaSanPham, MaNguoiDung, NoiDung, MaDanhGia]);
  
      await db.query('COMMIT');
      res.status(201).json({ message: 'Bình luận và đánh giá đã được thêm thành công' });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Lỗi khi lưu bình luận và đánh giá:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi lưu bình luận và đánh giá' });
    }
  });

// ==> API THANH TOÁN <==
app.post('/api/checkout', authenticateToken, async (req, res) => {
    const MaNguoiDung = req.user.MaNguoiDung;
    const { 
      selectedItems, 
      TenNguoiNhan, 
      DiaChiGiaoHang, 
      SDTNguoiNhan, 
      GhiChu,
      TongTien,
      PhuongThucThanhToan
    } = req.body;
  
    try {
      await db.query('START TRANSACTION');
  
      // 1. Tạo đơn hàng mới
      const NgayDatHang = new Date();
      const NgayGiaoHang = new Date(NgayDatHang.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 ngày sau
      const [orderResult] = await db.query(
        'INSERT INTO DONHANG (MaNguoiDung, NgayDatHang, TongTien, TenNguoiNhan, DiaChiGiaoHang, SDTNguoiNhan, NgayGiaoHang, GhiChu) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [MaNguoiDung, NgayDatHang, TongTien, TenNguoiNhan, DiaChiGiaoHang, SDTNguoiNhan, NgayGiaoHang, GhiChu]
      );
      const MaDonHang = orderResult.insertId;
  
      // 2. Chuyển các mục đã chọn vào chi tiết đơn hàng
      const insertChiTietDonHangQuery = `
        INSERT INTO CHITIETDONHANG (MaDonHang, MaMucGioHang, SoLuong, Gia, TrangThai)
        SELECT 
            ?, 
            m.MaMucGioHang, 
            m.SoLuongSanPham, 
            s.GiaBan,
            'Chờ xác nhận'
        FROM MUCGIOHANG m
        JOIN MAUSANPHAM ms ON m.MaMau = ms.MaMau
        JOIN SANPHAM s ON ms.MaSanPham = s.MaSanPham
        WHERE m.MaMucGioHang IN (?)
      `;
      await db.query(insertChiTietDonHangQuery, [MaDonHang, selectedItems]);
  
      // 3. Cập nhật trạng thái các mục giỏ hàng đã chọn
      const updateMucGioHangQuery = `
        UPDATE MUCGIOHANG m
        JOIN GIOHANG g ON m.IdGioHang = g.ID
        SET m.TrangThai = 'Đã mua'
        WHERE m.MaMucGioHang IN (?) AND g.MaNguoiDung = ?
      `;
      await db.query(updateMucGioHangQuery, [selectedItems, MaNguoiDung]);
      
      // 4. Thêm thông tin vào bảng thanh toán
      const insertThanhToanQuery = `
        INSERT INTO THANHTOAN (MaDonHang, NgayThanhToan, SoTienThanhToan, PhuongThucThanhToan, TrangThaiThanhToan)
        VALUES (?, ?, ?, ?, ?)
      `;
      // Tạo một đối tượng chứa dữ liệu thanh toán
      const thanhToanData = {
        MaDonHang,
        NgayThanhToan: new Date(),
        SoTienThanhToan: TongTien,
        PhuongThucThanhToan,
        TrangThaiThanhToan: 'Chưa thanh toán'
    };
    const [insertResult] = await db.query(insertThanhToanQuery, Object.values(thanhToanData));
    console.log('Dữ liệu thanh toán:', insertResult);
      
      await db.query('COMMIT');
  
      res.json({ message: 'Thanh toán thành công', MaDonHang });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Lỗi khi thanh toán:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi thanh toán' });
    }
  });


  // ==> API LICH SU DON HANG <==
  app.get('/data/order-history', authenticateToken, async (req, res) => {
    const MaNguoiDung = req.user.MaNguoiDung; 

    try {
        const [orders] = await db.query(`
            SELECT 
                d.MaDonHang,
                d.NgayDatHang,
                d.TongTien,
                d.TenNguoiNhan,
                d.DiaChiGiaoHang,
                d.SDTNguoiNhan,
                ct.MaChiTietDonHang,
                ct.SoLuong,
                ct.Gia,
                ct.TrangThai AS ChiTietTrangThai,
                m.MaMucGioHang,
                m.SoLuongSanPham,
                m.TongGiaSanPham,
                s.TenSanPham,
                s.HinhAnhChinh,
                ms.MaMau,
                ms.KichThuoc,
                ms.MauSac,
                ms.KieuDang
            FROM 
                DONHANG d
            JOIN 
                CHITIETDONHANG ct ON d.MaDonHang = ct.MaDonHang
            JOIN 
                MUCGIOHANG m ON ct.MaMucGioHang = m.MaMucGioHang
            JOIN 
                SANPHAM s ON m.MaMau = s.MaSanPham
            JOIN 
                MAUSANPHAM ms ON m.MaMau = ms.MaMau
            WHERE 
                d.MaNguoiDung = ? AND ct.TrangThai <> 'Đã hủy'  -- Chỉ định rõ ràng bảng ct
        `, [MaNguoiDung]);

        // Tổ chức lại dữ liệu để dễ dàng sử dụng trong frontend
        const organizedOrders = orders.reduce((acc, order) => {
            const { MaDonHang, NgayDatHang, TongTien, TenNguoiNhan, DiaChiGiaoHang, SDTNguoiNhan, HinhAnhChinh, TenSanPham } = order;
            if (!acc[MaDonHang]) {
                acc[MaDonHang] = {
                    id: MaDonHang,
                    date: NgayDatHang,
                    total: TongTien,
                    name: TenNguoiNhan,
                    address: DiaChiGiaoHang,
                    phone: SDTNguoiNhan,
                    items: []
                };
            }
            acc[MaDonHang].items.push({
                id: order.MaChiTietDonHang,
                quantity: order.SoLuong,
                price: order.Gia,
                status: order.ChiTietTrangThai,
                productId: order.MaMucGioHang,
                totalPrice: order.TongGiaSanPham,
                productName: TenSanPham,
                productImage: HinhAnhChinh,
                sampleId: order.MaMau,
                size: order.KichThuoc,
                color: order.MauSac,
                style: order.KieuDang
            });
            return acc;
        }, {});

        res.json(Object.values(organizedOrders)); // Trả về danh sách đơn hàng
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử đơn hàng:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy lịch sử đơn hàng' });
    }
});


//  ==> HỦY ĐƠN HÀNG <==
app.put('/api/order/cancel/:orderId', authenticateToken, async (req, res) => {
    const { orderId } = req.params;

    try {
        // Cập nhật trạng thái của tất cả sản phẩm trong đơn hàng thành "Đã hủy"
        const updateQuery = `
            UPDATE CHITIETDONHANG
            SET TrangThai = 'Đã hủy'
            WHERE MaDonHang = ?
        `;
        await db.query(updateQuery, [orderId]);

        res.json({ message: 'Đơn hàng đã được hủy thành công' });
    } catch (error) {
        console.error('Lỗi khi hủy đơn hàng:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi hủy đơn hàng' });
    }
});

// ==> HỦY SẢN PHẨM TRONG ĐƠN HÀNG <==
app.put('/api/order/cancel-item/:orderId/:itemId', authenticateToken, async (req, res) => {
    const { orderId, itemId } = req.params;

    try {
        // Cập nhật trạng thái của sản phẩm thành "Đã hủy"
        const updateQuery = `
            UPDATE CHITIETDONHANG
            SET TrangThai = 'Đã hủy'
            WHERE MaDonHang = ? AND MaChiTietDonHang = ?
        `;
        await db.query(updateQuery, [orderId, itemId]);

        res.json({ message: 'Sản phẩm đã được hủy thành công' });
    } catch (error) {
        console.error('Lỗi khi hủy sản phẩm:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi hủy sản phẩm' });
    }
});

// ==> API TAIKHOAN <==

app.get('/data/accounts', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM TAIKHOAN');
        res.json({ accounts: results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REGISTER
// Secret key cho JWT
const SECRET_KEY = process.env.SECRET_KEY;
app.post('/data/create/accounts', async (req, res) => {
    const data = req.body;
    const fields = [];
    const values = [];
    const placeholders = [];

    const plainPassword = data.MatKhau;

    try {
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        data.MatKhau = hashedPassword;

        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                fields.push(key);
                values.push(data[key]);
                placeholders.push('?');
            }
        }

        const sql = `INSERT INTO TAIKHOAN (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;

        const [results] = await db.query(sql, values);

        // Tạo token JWT sau khi tạo tài khoản
        const token = jwt.sign({ MaTaiKhoan: results.insertId }, SECRET_KEY, { expiresIn: '1h' });

        res.status(201).json({
            message: 'Tài khoản đã được thêm thành công',
            MaTaiKhoan: results.insertId,
            token: token
        });
    } catch (error) {
        console.error('Lỗi khi thêm tài khoản:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm tài khoản', error: error.message });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Tìm tài khoản dựa trên tên đăng nhập
        const [accounts] = await db.query('SELECT * FROM TAIKHOAN WHERE TenDangNhap = ?', [username]);

        if (accounts.length === 0) {
            return res.status(404).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
        }

        const account = accounts[0];

        // 2. So sánh mật khẩu đã băm với mật khẩu người dùng nhập
        const isPasswordValid = await bcrypt.compare(password, account.MatKhau);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
        }

        // 3. Lấy thông tin người dùng từ bảng `NGUOIDUNG` dựa trên email
        const [users] = await db.query('SELECT * FROM NGUOIDUNG WHERE Email = ?', [account.Email]);


        if (users.length === 0) {
            return res.status(404).json({ message: 'Thông tin người dùng không tồn tại' });
        }

        const user = users[0];

        // 4. Tạo token JWT với thông tin từ bảng `NGUOIDUNG`
        const token = jwt.sign(
            { MaNguoiDung: user.MaNguoiDung, LoaiNguoiDung: user.LoaiNguoiDung },
            process.env.SECRET_KEY,
            { expiresIn: '1h' }
        );
        console.log('Generated token:', token);
        console.log('Current SECRET_KEY:', process.env.SECRET_KEY);
        // 5. Lưu token vào cookie
        res.cookie('token', token, {
            httpOnly: true, // Cookie không thể truy cập bằng JavaScript
            secure: process.env.NODE_ENV === 'production',  // Chỉ đặt thành true khi bạn dùng HTTPS (cần thiết cho production)
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' cho production, 'Lax' cho development
            maxAge: 3600000, // 1 giờ (đơn vị là mili giây)
        });

        // 6. Gửi phản hồi thành công về client
        return res.status(200).json({
            message: 'Đăng nhập thành công',
            LoaiNguoiDung: user.LoaiNguoiDung,
            MaNguoiDung: user.MaNguoiDung,
            TenDangNhap: account.TenDangNhap,
        });
        // 5. Gửi phản hồi thành công về client
        // return res.status(200).json({
        //     message: 'Đăng nhập thành công',
        //     LoaiNguoiDung: user.LoaiNguoiDung,
        //     MaNguoiDung: user.MaNguoiDung,
        //     TenDangNhap: account.TenDangNhap,
        //     token: token 
        // });

    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng nhập' });
    }
});

// app.post('/login', async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         // 1. Tìm tài khoản dựa trên tên đăng nhập
//         const account = await new Promise((resolve, reject) => {
//             const sql = 'SELECT * FROM TAIKHOAN WHERE TenDangNhap = ?';
//             db.query(sql, [username], (err, results) => {
//                 if (err) {
//                     console.error('Error executing SQL query:', err);
//                     return reject(new Error('Lỗi trong quá trình truy vấn cơ sở dữ liệu'));
//                 }
//                 if (results.length === 0) return resolve(null);
//                 resolve(results[0]);
//             });
//         });

//         if (!account) {
//             return res.status(404).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
//         }

//         // 2. So sánh mật khẩu đã băm với mật khẩu người dùng nhập
//         const isPasswordValid = await bcrypt.compare(password, account.MatKhau);
//         if (!isPasswordValid) {
//             return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
//         }

//         // 3. Lấy thông tin người dùng từ bảng `NGUOIDUNG` dựa trên email
//         const user = await new Promise((resolve, reject) => {
//             const sql = 'SELECT * FROM NGUOIDUNG WHERE Email = ?';
//             db.query(sql, [account.Email], (err, results) => {
//                 if (err) return reject(new Error('Lỗi trong quá trình truy vấn cơ sở dữ liệu'));
//                 if (results.length === 0) return resolve(null);
//                 resolve(results[0]);
//             });
//         });

//         if (!user) {
//             return res.status(404).json({ message: 'Thông tin người dùng không tồn tại' });
//         }

//         // 4. Tạo token JWT với thông tin từ bảng `NGUOIDUNG`
//         const token = jwt.sign(
//             { MaNguoiDung: user.MaNguoiDung, LoaiNguoiDung: user.LoaiNguoiDung },
//             SECRET_KEY,
//             { expiresIn: '1h' }
//         );

//         // 5. Gửi token và loại tài khoản về cho client
//         return res.status(200).json({
//             message: 'Đăng nhập thành công',
//             token: token,
//             LoaiNguoiDung: user.LoaiNguoiDung,
//             TenDangNhap: account.TenDangNhap
//         });

//     } catch (error) {
//         console.error('Lỗi khi đăng nhập:', error);
//         return res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng nhập' });
//     }
// });

// Middleware để kiểm tra token JWT

// const authenticateToken = (req, res, next) => {
//     const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
//     if (token == null) return res.sendStatus(401);

//     jwt.verify(token, SECRET_KEY, (err, user) => {
//         if (err) return res.sendStatus(403);
//         req.user = user;
//         next();
//     });
// };

// API để lấy thông tin người dùng
// app.get('/userinfo', authenticateToken, (req, res) => {
//     const { MaNguoiDung } = req.user;

//     const sql = 'SELECT TenDangNhap, LoaiNguoiDung FROM TAIKHOAN WHERE MaNguoiDung = ?';
//     db.query(sql, [MaNguoiDung], (err, results) => {
//         if (err) {
//             console.error('Error executing SQL query:', err);
//             return res.status(500).json({ message: 'Lỗi trong quá trình truy vấn cơ sở dữ liệu' });
//         }
//         if (results.length === 0) return res.status(404).json({ message: 'Thông tin người dùng không tồn tại' });

//         res.json({
//             TenDangNhap: results[0].TenDangNhap,
//             LoaiNguoiDung: results[0].LoaiNguoiDung
//         });
//     });
// });

app.put('/data/update/accounts/:id', async (req, res) => {
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


// ==> API NGUOIDUNG <==
app.get('/data/users', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM NGUOIDUNG');
        res.json({ users: results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/data/create/users', async (req, res) => {
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

app.put('/data/update/users/:id', async (req, res) => {
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

app.delete('/data/delete/users/:id', async (req, res) => {
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

// ==> API SANPHAM <==
app.get('/data/products', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM SANPHAM');
        res.json({ products: results });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm' });
    }
});

//Tìm kiếm sản phẩm
app.get('/data/search/products', async (req, res) => {
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


const upload = multer({ storage: storage });

app.post('/data/create/products', upload.fields([
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
        req.files.HinhAnhChinh ? req.files.HinhAnhChinh[0].filename : null,
        req.files.AnhChiTiet01 ? req.files.AnhChiTiet01[0].filename : null,
        req.files.AnhChiTiet02 ? req.files.AnhChiTiet02[0].filename : null,
        req.files.AnhChiTiet03 ? req.files.AnhChiTiet03[0].filename : null,
        req.files.AnhChiTiet04 ? req.files.AnhChiTiet04[0].filename : null,
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

app.put('/data/update/products/:id', upload.fields([
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
            const hinhAnhChinhPath = HinhAnhChinh[0].filename;
            updateQuery += ', HinhAnhChinh = ?';
            updateValues.push(hinhAnhChinhPath);
        }
        if (AnhChiTiet01) {
            const anhChiTiet01Path = AnhChiTiet01[0].filename;
            updateQuery += ', AnhChiTiet01 = ?';
            updateValues.push(anhChiTiet01Path);
        }
        if (AnhChiTiet02) {
            const anhChiTiet02Path = AnhChiTiet02[0].filename;
            updateQuery += ', AnhChiTiet02 = ?';
            updateValues.push(anhChiTiet02Path);
        }
        if (AnhChiTiet03) {
            const anhChiTiet03Path = AnhChiTiet03[0].filename;
            updateQuery += ', AnhChiTiet03 = ?';
            updateValues.push(anhChiTiet03Path);
        }
        if (AnhChiTiet04) {
            const anhChiTiet04Path = AnhChiTiet04[0].filename;
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

app.delete('/data/delete/products/:id', async (req, res) => {
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


// ==> API LOAISANPHAM <==
app.get('/data/categories', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM LOAISANPHAM');
        res.json({ categories: results });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách loại sản phẩm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách loại sản phẩm' });
    }
});

app.post('/data/create/categories', async (req, res) => {
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

app.put('/data/update/categories/:id', async (req, res) => {
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

app.delete('/data/delete/categories/:id', async (req, res) => {
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

// ==> API MAUSANPHAM <==
app.get('/data/productsample', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM MAUSANPHAM');
        res.json({ productsample: results });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách mẫu sản phẩm:', err);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách mẫu sản phẩm' });
    }
});

app.post('/data/create/productsample', async (req, res) => {
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

app.put('/data/update/productsample/:id', async (req, res) => {
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

app.delete('/data/delete/productsample/:id', async (req, res) => {
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


// ==> API GIOHANG <==
app.get('/data/cart', (req, res) => {
    db.query('SELECT * FROM GIOHANG', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ cart: results });
    });
});

app.post('/data/create/cart', async (req, res) => {
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

app.put('/data/update/cart/:id', async (req, res) => {
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

app.delete('/data/delete/cart/:id', (req, res) => {
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
app.get('/data/cart-item', (req, res) => {
    db.query('SELECT * FROM MUCGIOHANG', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ cartItem: results });
    });
});

app.post('/data/create/cart-item', async (req, res) => {
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

app.put('/data/update/cart-item/:id', async (req, res) => {
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

app.delete('/data/delete/cart-item/:id', (req, res) => {
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


// ==> API DONHANG <==
app.get('/data/order', (req, res) => {
    db.query('SELECT * FROM DONHANG', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ order: results });
    });
});

app.post('/data/create/order', async (req, res) => {
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

app.put('/data/update/order/:id', async (req, res) => {
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

app.delete('/data/delete/order/:id', (req, res) => {
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
app.get('/data/order-detail', (req, res) => {
    db.query('SELECT * FROM CHITIETDONHANG', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ orderDetail: results });
    });
});

app.post('/data/create/order-detail', async (req, res) => {
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

app.put('/data/update/order-detail/:id', async (req, res) => {
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

app.delete('/data/delete/order-detail/:id', (req, res) => {
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

// ==== //
app.listen(port, () => {
    console.log(`Server đang chạy trên post ${port}`)
});
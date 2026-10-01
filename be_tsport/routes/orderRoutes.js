const express = require('express');
const router = express.Router();
const db = require('../connect');
const authenticateToken = require('../authMiddleware');

// ==> API THANH TOÁN <==
router.post('/api/checkout', authenticateToken, async (req, res) => {
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
  router.get('/data/order-history', authenticateToken, async (req, res) => {
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
                s.MaSanPham,
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
                MAUSANPHAM ms ON m.MaMau = ms.MaMau
            JOIN 
                SANPHAM s ON ms.MaSanPham = s.MaSanPham
            WHERE 
                d.MaNguoiDung = ? AND ct.TrangThai <> 'Đã hủy'
            ORDER BY 
                d.NgayDatHang DESC, d.MaDonHang, ct.MaChiTietDonHang
        `, [MaNguoiDung]);

        // Tổ chức lại dữ liệu theo cấu trúc mong muốn
        const organizedOrders = orders.reduce((acc, order) => {
            const orderId = order.MaDonHang;
            
            // Nếu đơn hàng chưa tồn tại, tạo mới
            if (!acc[orderId]) {
                acc[orderId] = {
                    id: orderId,
                    date: new Date(order.NgayDatHang).toLocaleDateString('vi-VN'),
                    total: order.TongTien,
                    name: order.TenNguoiNhan,
                    address: order.DiaChiGiaoHang,
                    phone: order.SDTNguoiNhan,
                    items: []
                };
            }

            // Thêm sản phẩm vào đơn hàng
            const existingItem = acc[orderId].items.find(
                item => item.id === order.MaChiTietDonHang
            );

            if (!existingItem) {
                acc[orderId].items.push({
                    id: order.MaChiTietDonHang,
                    productId: order.MaSanPham,
                    productName: order.TenSanPham,
                    productImage: order.HinhAnhChinh,
                    quantity: order.SoLuong,
                    price: order.Gia,
                    status: order.ChiTietTrangThai,
                    cartItemId: order.MaMucGioHang,
                    totalPrice: order.TongGiaSanPham,
                    sampleId: order.MaMau,
                    size: order.KichThuoc,
                    color: order.MauSac,
                    style: order.KieuDang
                });
            }

            return acc;
        }, {});

        // Log để debug
        console.log('Raw orders data:', orders);
        console.log('Organized orders:', Object.values(organizedOrders));

        res.json(Object.values(organizedOrders));
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử đơn hàng:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy lịch sử đơn hàng' });
    }
});


//  ==> HỦY ĐƠN HÀNG <==
router.put('/api/order/cancel/:orderId', authenticateToken, async (req, res) => {
    const { orderId } = req.params;

    try {
        // Cập nhật trạng thái của tất cả sản phẩm trong đơn hàng thành "Đã hủy"
        const updateQuery = `
            UPDATE CHITIETDONHANG
            SET TrangThai = 'Đã Hủy'
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
router.put('/api/order/cancel-item/:orderId/:itemId', authenticateToken, async (req, res) => {
    const { orderId, itemId } = req.params;

    try {
        // Cập nhật trạng thái của sản phẩm thành "Đã hủy"
        const updateQuery = `
            UPDATE CHITIETDONHANG
            SET TrangThai = 'Đã Hủy'
            WHERE MaDonHang = ? AND MaChiTietDonHang = ?
        `;
        await db.query(updateQuery, [orderId, itemId]);

        res.json({ message: 'Sản phẩm đã được hủy thành công' });
    } catch (error) {
        console.error('Lỗi khi hủy sản phẩm:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi hủy sản phẩm' });
    }
});

// ==> API lấy tất cả đơn hàng cho admin <==
router.get('/data/admin/orders', authenticateToken, async (req, res) => {
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
                s.MaSanPham,
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
                MAUSANPHAM ms ON m.MaMau = ms.MaMau
            JOIN 
                SANPHAM s ON ms.MaSanPham = s.MaSanPham
            ORDER BY 
                d.NgayDatHang DESC, d.MaDonHang, ct.MaChiTietDonHang
        `);

        // Tổ chức lại dữ liệu theo cấu trúc mong muốn
        const organizedOrders = orders.reduce((acc, order) => {
            const orderId = order.MaDonHang;
            
            // Nếu đơn hàng chưa tồn tại, tạo mới
            if (!acc[orderId]) {
                acc[orderId] = {
                    id: orderId,
                    date: new Date(order.NgayDatHang).toLocaleDateString('vi-VN'),
                    total: order.TongTien,
                    name: order.TenNguoiNhan,
                    address: order.DiaChiGiaoHang,
                    phone: order.SDTNguoiNhan,
                    items: []
                };
            }

            // Thêm sản phẩm vào đơn hàng
            const existingItem = acc[orderId].items.find(
                item => item.id === order.MaChiTietDonHang
            );

            if (!existingItem) {
                acc[orderId].items.push({
                    id: order.MaChiTietDonHang,
                    productId: order.MaSanPham,
                    productName: order.TenSanPham,
                    productImage: order.HinhAnhChinh,
                    quantity: order.SoLuong,
                    price: order.Gia,
                    status: order.ChiTietTrangThai,
                    cartItemId: order.MaMucGioHang,
                    totalPrice: order.TongGiaSanPham,
                    sampleId: order.MaMau,
                    size: order.KichThuoc,
                    color: order.MauSac,
                    style: order.KieuDang
                });
            }

            return acc;
        }, {});

        // Log để debug
        console.log('Raw orders data:', orders);
        console.log('Organized orders:', Object.values(organizedOrders));

        res.json(Object.values(organizedOrders));
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử đơn hàng:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy lịch sử đơn hàng' });
    }
});





// ==> API cập nhật trạng thái đơn hàng <==
router.put('/api/order/:action/:orderId', authenticateToken, async (req, res) => {
    const { action, orderId } = req.params;
    let newStatus;
    console.log('Action', action, 'OrderId', orderId);

    // Xác định trạng thái mới dựa vào action
    switch (action) {
        case 'Chờ xác nhận':
            newStatus = 'Chờ xác nhận';
            break;
        case 'Đã xác nhận':
            newStatus = 'Đã xác nhận';
            break;
        case 'Đã Hủy':
            newStatus = 'Đã Hủy';
            break;
        case 'Đang giao':
            newStatus = 'Đang giao';
            break;
        case 'Hoàn Thành':
            newStatus = 'Hoàn Thành';
            break;
        default:
            return res.status(400).json({ error: 'Hành động không hợp lệ' });
    }
    console.log('Action', action)

    try {
        // Cập nhật trạng thái chỉ cho các chi tiết đơn hàng chưa bị hủy
        await db.query(
            'UPDATE CHITIETDONHANG SET TrangThai = ? WHERE MaDonHang = ? AND TrangThai != ?',
            [newStatus, orderId, 'Đã Hủy']
        );
        console.log('Action', action)

        res.json({ message: 'Cập nhật trạng thái đơn hàng thành công' });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng' });
    }
});

module.exports = router;

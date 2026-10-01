const express = require('express');
const router = express.Router();
const db = require('../connect');

// ==> API Tính tổng doanh thu theo tháng <==
router.get('/api/revenue', async (req, res) => {
    const query = `
      SELECT 
          DATE_FORMAT(D.NgayDatHang, '%Y-%m') AS month, 
          SUM(C.SoLuong * C.Gia) AS totalRevenue
      FROM 
          DONHANG D
      JOIN 
          CHITIETDONHANG C ON D.MaDonHang = C.MaDonHang
      WHERE 
          D.NgayDatHang IS NOT NULL
          AND C.TrangThai != 'Đã Hủy'
      GROUP BY 
          month
      ORDER BY 
          month;
    `;
    
    try {
      const [results] = await db.execute(query);
      console.log("Results from DB:", results); // In ra để kiểm tra
      const formattedResults = results.map(item => ({
        month: item.month,
        totalRevenue: item.totalRevenue || 0,
      }));
      res.json(formattedResults);
    } catch (err) {
      console.error("Database query error:", err);
      res.status(500).json({ error: err.message });
    }
});



  // ==> API Tính tổng sản phẩm bán ra theo tháng <==
  router.get('/api/products-sales', async (req, res) => {
    const query = `
      SELECT 
          DATE_FORMAT(D.NgayDatHang, '%Y-%m') AS month, 
          SUM(C.SoLuong) AS totalSales
      FROM 
          DONHANG D
      JOIN 
          CHITIETDONHANG C ON D.MaDonHang = C.MaDonHang
      WHERE 
          D.NgayDatHang IS NOT NULL
          AND C.TrangThai != 'Đã Hủy'
      GROUP BY 
          month
      ORDER BY 
          month;
    `;
  
    try {
      const [results] = await db.execute(query);
      console.log("Results from DB:", results);
      const formattedResults = results.map(item => ({
        month: item.month,
        totalSales: item.totalSales || 0,
      }));
      res.json(formattedResults);
    } catch (err) {
      console.error("Database query error:", err);
      res.status(500).json({ error: err.message });  // Trả lỗi với message chi tiết
    }
  });


  // ==> API Tính sản phẩm tồn kho <==
  router.get('/api/inventory', async (req, res) => {
    const query = `
        SELECT 
            SP.TenSanPham,
            SP.SoLuong AS totalStock,
            COALESCE(SUM(CTDH.SoLuong), 0) AS totalSold,
            (SP.SoLuong - COALESCE(SUM(CTDH.SoLuong), 0)) AS remainingStock
        FROM 
            SANPHAM SP
        LEFT JOIN
            MAUSANPHAM M ON SP.MaSanPham = M.MaSanPham
        LEFT JOIN 
            MUCGIOHANG MG ON M.MaMau = MG.MaMau
        LEFT JOIN 
            CHITIETDONHANG CTDH ON MG.MaMucGioHang = CTDH.MaMucGioHang
        LEFT JOIN
            DONHANG DH ON CTDH.MaDonHang = DH.MaDonHang
        WHERE
            CTDH.TrangThai != 'Đã Hủy'
        GROUP BY 
            SP.MaSanPham, SP.TenSanPham;
    `;

    try {
        const [results] = await db.execute(query);
        console.log("Results from DB:", results);
        res.json(results);
    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).json({ error: err.message });
    }
});


// ==> API Tính top sản phẩm bán chạy nhất <==
router.get('/api/top-products', async (req, res) => {
    const query = `
        SELECT 
            SP.TenSanPham,
            SP.GiaBan,
            COALESCE(SUM(CTDH.SoLuong), 0) AS totalSold
        FROM 
            SANPHAM SP
        LEFT JOIN
            MAUSANPHAM M ON SP.MaSanPham = M.MaSanPham
        LEFT JOIN 
            MUCGIOHANG MG ON M.MaMau = MG.MaMau
        LEFT JOIN 
            CHITIETDONHANG CTDH ON MG.MaMucGioHang = CTDH.MaMucGioHang
        LEFT JOIN
            DONHANG DH ON CTDH.MaDonHang = DH.MaDonHang
        WHERE
            CTDH.TrangThai != 'Đã Hủy'
        GROUP BY 
            SP.MaSanPham, SP.TenSanPham, SP.GiaBan
        ORDER BY 
            totalSold DESC
        LIMIT 5;
    `;

    try {
        const [results] = await db.execute(query);
        console.log("Results from DB:", results);
        res.json(results);
    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).json({ error: err.message });
    }
});


// ==> API tính top khách hàng mua nhiều sản phẩm nhất <==
router.get('/api/top-users', async (req, res) => {
    const query = `
        SELECT 
            ND.TenNguoiDung,
            TK.TenDangNhap,
            ND.Email,
            COALESCE(SUM(CTDH.SoLuong), 0) AS totalBought
        FROM 
            NGUOIDUNG ND
        JOIN
            DONHANG DH ON ND.MaNguoiDung = DH.MaNguoiDung
        LEFT JOIN
            CHITIETDONHANG CTDH ON DH.MaDonHang = CTDH.MaDonHang
        LEFT JOIN 
            TAIKHOAN TK ON ND.MaNguoiDung = TK.MaTaiKhoan
        WHERE 
            CTDH.TrangThai != 'Đã Hủy'
        GROUP BY 
            ND.MaNguoiDung, TK.TenDangNhap, ND.TenNguoiDung, ND.Email
        ORDER BY 
            totalBought DESC
        LIMIT 5;
    `;

    try {
        const [results] = await db.execute(query);
        console.log("Results from DB:", results);
        res.json(results);
    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

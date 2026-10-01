const express = require('express');
const router = express.Router();
const db = require('../connect');
const authenticateToken = require('../authMiddleware');
const { tinhDiemTuongTac, tinhDoTuongDong } = require('../services/recommendation');

// ==> API Lưu hành vi người dùng <==
router.post('/api/user-action', authenticateToken, async (req, res) => {
    const { MaSanPham, LoaiHanhVi } = req.body;
    const MaNguoiDung = req.user.MaNguoiDung;

    // Ghi log các giá trị đầu vào
    console.log('Received request with data:', {
        MaNguoiDung,
        MaSanPham,
        LoaiHanhVi
    });

    if (!MaNguoiDung || !MaSanPham || !LoaiHanhVi) {
        console.error('Missing required information:', {
            MaNguoiDung,
            MaSanPham,
            LoaiHanhVi
        });
        return res.status(400).json({ message: 'Thông tin yêu cầu không hợp lệ' });
    }

    const userAction = {
        MaNguoiDung,
        MaSanPham,
        LoaiHanhVi,
        ThoiGian: new Date()
    };

    const query = 'INSERT INTO HANHVINGUOIDUNG (MaNguoiDung, MaSanPham, LoaiHanhVi, ThoiGian) VALUES (?, ?, ?, ?)';
    const values = [userAction.MaNguoiDung, userAction.MaSanPham, userAction.LoaiHanhVi, userAction.ThoiGian];

    try {
        await db.query(query, values); // Chạy truy vấn SQL để lưu hành vi người dùng
        console.log('User action inserted successfully:', userAction);
        return res.status(200).json({ message: 'Hành vi người dùng được lưu thành công' });
    } catch (err) {
        console.error('Error inserting user action:', err);
        return res.status(500).json({ message: 'Lỗi khi lưu hành vi người dùng' });
    }
});


// Hàm chính để lấy đề xuất sản phẩm
router.get('/api/recommendations', authenticateToken, async (req, res) => {
    try {
        const maNguoiDung = req.user.MaNguoiDung;
        const soLuongDeXuat = parseInt(req.query.limit) || 5;

        console.log('maNguoiDung:', maNguoiDung);

        // 1. Lấy dữ liệu hành vi của tất cả người dùng
        const [rows] = await db.execute(`
            SELECT MaNguoiDung, MaSanPham, LoaiHanhVi 
            FROM HANHVINGUOIDUNG
            WHERE ThoiGian >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);

        console.log('Rows from HANHVINGUOIDUNG:', rows);

        // 2. Tạo ma trận người dùng - sản phẩm
        const userProductMatrix = {};
        rows.forEach(row => {
            if (!userProductMatrix[row.MaNguoiDung]) {
                userProductMatrix[row.MaNguoiDung] = {};
            }
            userProductMatrix[row.MaNguoiDung][row.MaSanPham] = 
                (userProductMatrix[row.MaNguoiDung][row.MaSanPham] || 0) + 
                tinhDiemTuongTac(row.LoaiHanhVi);
        });

        console.log('User-Product Matrix:', userProductMatrix);

        // 3. Tính độ tương đồng với các người dùng khác
        const similarities = [];
        const targetUserVector = userProductMatrix[maNguoiDung] || {};

        console.log('Target User Vector:', targetUserVector);

        for(const otherUserId in userProductMatrix) {
            if(otherUserId != maNguoiDung) {
                const similarity = tinhDoTuongDong(
                    targetUserVector,
                    userProductMatrix[otherUserId]
                );
                similarities.push({
                    userId: otherUserId,
                    similarity: similarity
                });
            }
        }

        console.log('Similarities:', similarities);

        // 4. Sắp xếp và lấy top N người dùng tương đồng nhất
        similarities.sort((a, b) => b.similarity - a.similarity);
        const topSimilarUsers = similarities.slice(0, 10);

        console.log('Top Similar Users:', topSimilarUsers);

        // 5. Lấy các sản phẩm mà người dùng đã tương tác
        const [productsInteracted] = await db.execute(`
            SELECT DISTINCT MaSanPham 
            FROM HANHVINGUOIDUNG 
            WHERE MaNguoiDung = ?
        `, [maNguoiDung]);

        console.log('Products Interacted:', productsInteracted);

        const productsInteractedSet = new Set(
            productsInteracted.map(p => p.MaSanPham)
        );

        console.log('Products Interacted Set:', productsInteractedSet);

        // 6. Tính điểm đề xuất cho các sản phẩm
        const productScores = {};

        for(const similarUser of topSimilarUsers) {
            const [userProducts] = await db.execute(`
                SELECT MaSanPham, LoaiHanhVi 
                FROM HANHVINGUOIDUNG 
                WHERE MaNguoiDung = ?
            `, [similarUser.userId]);

            console.log(`User Products for ${similarUser.userId}:`, userProducts);

            userProducts.forEach(product => {
                if(!productsInteractedSet.has(product.MaSanPham)) {
                    productScores[product.MaSanPham] = 
                        (productScores[product.MaSanPham] || 0) + 
                        similarUser.similarity * tinhDiemTuongTac(product.LoaiHanhVi);
                }
            });
        }

        console.log('Product Scores:', productScores);

        // 7. Sắp xếp và lấy top N sản phẩm đề xuất
        const recommendedProducts = Object.entries(productScores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, soLuongDeXuat)
            .map(([productId]) => parseInt(productId));

        console.log('Recommended Products:', recommendedProducts);

        // 8. Lấy thông tin chi tiết của các sản phẩm đề xuất
        if(recommendedProducts.length > 0) {
            const [productDetails] = await db.execute(`
                SELECT * FROM SANPHAM 
                WHERE MaSanPham IN (${recommendedProducts.join(',')})
            `);

            console.log('Product Details:', productDetails);

            res.json({
                status: 'success',
                data: productDetails
            });
        } else {
            console.log('No Recommended Products found.');
            res.json({
                status: 'success',
                data: []
            });
        }

    } catch (error) {
        console.error('Lỗi khi lấy đề xuất sản phẩm:', error);
        res.status(500).json({
            status: 'error',
            message: 'Lỗi khi lấy đề xuất sản phẩm',
            error: error.message
        });
    }
});


  // ==> API kiểm tra hành vi người dùng <==
  router.get('/api/user-behavior/check', async (req, res) => {
    try {
        // Lấy thông tin user từ cookie
        const userCookie = req.cookies.user;
        if (!userCookie) {
            return res.status(401).json({ 
                hasUserBehavior: false,
                message: 'Không tìm thấy thông tin người dùng' 
            });
        }

        const user = JSON.parse(userCookie);
        const maNguoiDung = user.MaNguoiDung;

        // Kiểm tra xem người dùng có hành vi nào không
        const [rows] = await db.execute(`
            SELECT COUNT(*) as behaviorCount 
            FROM HANHVINGUOIDUNG 
            WHERE MaNguoiDung = ?
        `, [maNguoiDung]);

        const hasUserBehavior = rows[0].behaviorCount > 0;

        res.json({
            hasUserBehavior,
            message: hasUserBehavior ? 'Người dùng có hành vi' : 'Người dùng chưa có hành vi'
        });

    } catch (error) {
        console.error('Lỗi khi kiểm tra hành vi người dùng:', error);
        res.status(500).json({ 
            hasUserBehavior: false,
            message: 'Đã xảy ra lỗi khi kiểm tra hành vi người dùng',
            error: error.message 
        });
    }
});

module.exports = router;

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

        for (const otherUserId in userProductMatrix) {
            if (otherUserId != maNguoiDung) {
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
        
        const topSimilarUsers = similarities
            .filter(
                user =>
                Number.isFinite(user.similarity) &&
                user.similarity > 0
            )
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10);


        console.log('Top Similar Users:', topSimilarUsers);

        // 5. Lấy các sản phẩm mà người dùng đã tương tác
        const [productsInteracted] = await db.execute(`
            SELECT DISTINCT MaSanPham 
            FROM HANHVINGUOIDUNG 
            WHERE MaNguoiDung = ?
            AND LoaiHanhVi = 'Mua'
        `, [maNguoiDung]);

        console.log('Products Interacted:', productsInteracted);

        // Chuyển thành Set để kiểm tra sản phẩm đã mua nhanh hơn
        const purchasedProductIds = new Set(
            productsInteracted.map(p => Number(p.MaSanPham))
        );

        console.log(
            'Purchased Product IDs:',
            purchasedProductIds
        );

        // 6. Tính điểm đề xuất cho các sản phẩm
        const productScores = {};

        for (const similarUser of topSimilarUsers) {
            const [userProducts] = await db.execute(`
                SELECT MaSanPham, LoaiHanhVi
                FROM HANHVINGUOIDUNG
                WHERE MaNguoiDung = ?
                  AND ThoiGian >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            `, [similarUser.userId]);

            console.log(
                `User Products for ${similarUser.userId}:`,
                userProducts
            );

            userProducts.forEach(product => {
                const productId = Number(product.MaSanPham);

                // Bỏ qua sản phẩm người dùng hiện tại đã mua
                if (purchasedProductIds.has(productId)) {
                    return;
                }

                // Tính điểm dựa trên độ tương đồng và hành vi
                const score =
                    similarUser.similarity *
                    tinhDiemTuongTac(product.LoaiHanhVi);

                // Cộng dồn điểm của sản phẩm
                productScores[productId] =
                    (productScores[productId] || 0) + score;
            });
        }

        console.log('Product Scores:', productScores);


        // 7. Sắp xếp và lấy top N sản phẩm đề xuất
        const recommendedProducts = Object.entries(productScores)
            .filter(([, score]) =>
                Number.isFinite(score) && score > 0
            )
            .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
            .slice(0, soLuongDeXuat)
            .map(([productId]) => Number(productId));

        console.log('Recommended Products:', recommendedProducts);

        // 8. Lấy thông tin chi tiết của các sản phẩm đề xuất
        if (recommendedProducts.length > 0) {
            const productIds = recommendedProducts.join(',');

            const [productDetails] = await db.execute(`
                SELECT *
                FROM SANPHAM
                WHERE MaSanPham IN (${productIds})
                ORDER BY FIELD(MaSanPham, ${productIds})
            `);

            // Bổ sung điểm gợi ý và thứ hạng cho từng sản phẩm
            const productsWithScores = productDetails.map(
                (product, index) => ({
                    ...product,
                    recommendationScore:
                        productScores[product.MaSanPham] ?? 0,
                    rank: index + 1
                })
            );

            console.log(
                'Ranked Product Details:',
                productsWithScores.map(product => ({
                    rank: product.rank,
                    MaSanPham: product.MaSanPham,
                    TenSanPham: product.TenSanPham,
                    score: product.recommendationScore
                }))
            );

            return res.json({
                status: 'success',
                data: productsWithScores
            });
        }

        // Không có sản phẩm từ Collaborative Filtering
        return res.json({
            status: 'success',
            data: []
        });


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
router.get(
    '/api/user-behavior/check',
    authenticateToken,
    async (req, res) => {
        try {
            const maNguoiDung = req.user.MaNguoiDung;

            if (!maNguoiDung) {
                return res.status(401).json({
                    hasUserBehavior: false,
                    message: 'Không xác định được người dùng'
                });
            }

            const [rows] = await db.execute(
                `SELECT COUNT(*) AS behaviorCount
                 FROM HANHVINGUOIDUNG
                 WHERE MaNguoiDung = ?`,
                [maNguoiDung]
            );

            const hasUserBehavior =
                Number(rows[0].behaviorCount) > 0;

            return res.status(200).json({
                hasUserBehavior,
                message: hasUserBehavior
                    ? 'Người dùng có hành vi'
                    : 'Người dùng chưa có hành vi'
            });
        } catch (error) {
            console.error(
                'Lỗi khi kiểm tra hành vi người dùng:',
                error
            );

            return res.status(500).json({
                hasUserBehavior: false,
                message: 'Lỗi khi kiểm tra hành vi người dùng'
            });
        }
    }
);

module.exports = router;

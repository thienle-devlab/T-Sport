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
        const requestedLimit = Number.parseInt(req.query.limit, 10);
        const soLuongDeXuat =
            Number.isInteger(requestedLimit) && requestedLimit > 0
                ? Math.min(requestedLimit, 50)
                : 5;

        console.log('maNguoiDung:', maNguoiDung);
        console.log('soLuongDeXuat:', soLuongDeXuat);

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

        
        // 8. Lấy thông tin sản phẩm từ Collaborative Filtering
        let collaborativeProducts = [];

        if (recommendedProducts.length > 0) {
            const placeholders = recommendedProducts
                .map(() => '?')
                .join(',');

            const [productDetails] = await db.execute(
                `
                SELECT *
                FROM SANPHAM
                WHERE MaSanPham IN (${placeholders})
                ORDER BY FIELD(MaSanPham, ${placeholders})
                `,
                [...recommendedProducts, ...recommendedProducts]
            );

            collaborativeProducts = productDetails.map(
                (product, index) => ({
                    ...product,
                    recommendationScore:
                        productScores[Number(product.MaSanPham)] ?? 0,
                    recommendationSource: 'COLLABORATIVE_FILTERING',
                    rank: index + 1
                })
            );
        }

        
        // 9. Nếu CF chưa đủ sản phẩm, bổ sung bằng fallback
        const remainingCount = Math.max(
            0,
            soLuongDeXuat - collaborativeProducts.length
        );

        let fallbackProducts = [];

        if (remainingCount > 0) {
            // Loại sản phẩm đã mua và sản phẩm CF đã chọn
            const excludedProductIds = [
                ...new Set([
                    ...purchasedProductIds,
                    ...collaborativeProducts.map(
                        product => Number(product.MaSanPham)
                    )
                ])
            ].filter(id => Number.isSafeInteger(id) && id > 0);

            // Tạo placeholder tương ứng với số ID cần loại trừ
            const exclusionCondition =
                excludedProductIds.length > 0
                    ? `AND sp.MaSanPham NOT IN (
                        ${excludedProductIds.map(() => '?').join(',')}
                    )`
                    : '';

            // Tham số phải khớp thứ tự placeholder trong SQL:
            // các ID cần loại trừ trước, LIMIT ở cuối
            const fallbackParams = [
                ...excludedProductIds,
                remainingCount
            ];

            const fallbackSql = `
                SELECT
                    sp.*,
                    COALESCE(pop.popularityScore, 0) AS popularityScore
                FROM SANPHAM sp
                LEFT JOIN (
                    SELECT
                        MaSanPham,
                        SUM(
                            CASE LoaiHanhVi
                                WHEN 'Xem' THEN 1
                                WHEN 'ThemGioHang' THEN 2
                                WHEN 'Mua' THEN 3
                                ELSE 0
                            END
                        ) AS popularityScore
                    FROM HANHVINGUOIDUNG
                    WHERE ThoiGian >=
                        DATE_SUB(NOW(), INTERVAL 30 DAY)
                    GROUP BY MaSanPham
                ) pop ON pop.MaSanPham = sp.MaSanPham
                WHERE 1 = 1
                ${exclusionCondition}
                ORDER BY
                    popularityScore DESC,
                    sp.MaSanPham ASC
                LIMIT ?
            `;

            // Kiểm tra số placeholder và số tham số trước khi truy vấn
            const placeholderCount =
                (fallbackSql.match(/\?/g) || []).length;

            console.log('Fallback SQL debug:', {
                remainingCount,
                excludedProductIds,
                placeholderCount,
                fallbackParams,
                fallbackParamsLength: fallbackParams.length
            });

            if (placeholderCount !== fallbackParams.length) {
                throw new Error(
                    `Fallback SQL parameter mismatch: ` +
                    `${placeholderCount} placeholders, ` +
                    `${fallbackParams.length} parameters`
                );
            }

            const [popularProducts] = await db.execute(
                fallbackSql,
                fallbackParams
            );

            fallbackProducts = popularProducts.map(
                (product, index) => ({
                    ...product,
                    recommendationScore: null,
                    popularityScore: Number(product.popularityScore),
                    recommendationSource: 'POPULARITY',
                    rank: collaborativeProducts.length + index + 1
                })
            );
        }

        // 10. Gộp kết quả CF và fallback
        const finalProducts = [
            ...collaborativeProducts,
            ...fallbackProducts
        ].slice(0, soLuongDeXuat);

        console.log(
            'Final Recommendations:',
            finalProducts.map(product => ({
                MaSanPham: product.MaSanPham,
                TenSanPham: product.TenSanPham,
                source: product.recommendationSource,
                score: product.recommendationScore,
                popularityScore: product.popularityScore,
                rank: product.rank
            }))
        );

        return res.json({
            status: 'success',
            data: finalProducts
        });



    } catch (error) {
        console.error('Error getting recommendations:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        return res.status(500).json({
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

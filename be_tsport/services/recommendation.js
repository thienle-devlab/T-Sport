// Các hàm tính toán cho hệ thống đề xuất sản phẩm (collaborative filtering)

// Hàm tính điểm tương tác của người dùng với sản phẩm
function tinhDiemTuongTac(loaiHanhVi) {
    switch (loaiHanhVi) {
        case 'Xem':
            return 1;
        case 'ThemGioHang':
            return 2;
        case 'Mua':
            return 3;
        default:
            return 0;
    }
}

// Hàm tính độ tương đồng giữa hai người dùng sử dụng Cosine Similarity
function tinhDoTuongDong(vector1, vector2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const productID in vector1) {
        const score1 = vector1[productID];
        const score2 = vector2[productID] || 0;

        dotProduct += score1 * score2;
        norm1 += score1 * score1;
    }

    for (const productID in vector2) {
        const score = vector2[productID];
        norm2 += score * score;
    }

    // Không thể tính cosine similarity nếu một vector bằng 0
    if (norm1 === 0 || norm2 === 0) {
        return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}


module.exports = { tinhDiemTuongTac, tinhDoTuongDong };

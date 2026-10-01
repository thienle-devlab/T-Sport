// Các hàm tính toán cho hệ thống đề xuất sản phẩm (collaborative filtering)

// Hàm tính điểm tương tác của người dùng với sản phẩm
function tinhDiemTuongTac(loaiHanhVi){
    switch(loaiHanhVi){
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

    for(const productID in vector1) {
        if(vector2[productID]){
            dotProduct += vector1[productID] * vector2[productID];
        }
        norm1 += vector1[productID] * vector1[productID];
    }

    for(const productID in vector2) {
        norm2 += vector2[productID] * vector2[productID];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

module.exports = { tinhDiemTuongTac, tinhDoTuongDong };

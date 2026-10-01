const express = require('express');
const router = express.Router();
const db = require('../connect');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// REGISTER
// Secret key cho JWT
const SECRET_KEY = process.env.SECRET_KEY;
router.post('/data/create/accounts', async (req, res) => {
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
router.post('/login', async (req, res) => {
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

// ==> Logout <==
router.post('/api/logout', (req, res) => {
    // Xóa token khỏi cookie
    res.clearCookie('token', { path: '/' }); // Xóa token khỏi cookie

    // Phản hồi đăng xuất thành công
    res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;

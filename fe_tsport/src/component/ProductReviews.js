import React, { useEffect, useState } from 'react';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import avatar from '../img/avatar.jpg'

const ProductReviews = ({productId}) => {
  const baseURL = process.env.REACT_APP_API_BASE_URL;
  // const [isShowReviewForm, setIsShowReviewForm] = useState(false);
  // const [rating, setRating] = useState(0);
  // const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState([]);
  const [starPercentages, setStarPercentages] = useState([]);
  // const [uniqueReviews, setUniqueReviews] = useState([]);
  const [averageStars, setAverageStars] = useState(0);
  const [isShowAllReviews, setIsShowAllReviews] = useState(false);

//   const reviews = [
//     { id: 1, author: 'Emily Selman', rating: 5, comment: "This is the bag of my dreams. I took it on my last vacation and was able to fit an absurd amount of snacks for the many long and hungry flights." },
//     { id: 2, author: 'Hector Gibbons', rating: 5, comment: "Before getting the Ruck Snack, I struggled my whole life with pulverized snacks, endless crumbs, and other heartbreaking snack catastrophes. Now, I can stow my snacks with confidence and style!" },
//     { id: 3, author: 'John Doe', rating: 4, comment: "Great product, but could use more compartments." },
//     { id: 4, author: 'Jane Smith', rating: 3, comment: "It's good but a bit overpriced." },
//     // Thêm nhiều bình luận khác nếu cần
//   ];

  // const starPercentages = [
  //   { stars: 5, percentage: 63 },
  //   { stars: 4, percentage: 10 },
  //   { stars: 3, percentage: 6 },
  //   { stars: 2, percentage: 12 },
  //   { stars: 1, percentage: 9 },
  // ];

// Hàm gọi API để lấy bình luận và đánh giá
useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${baseURL}/api/reviews/${productId}`, { //http://localhost:3001/api/reviews/${productId}
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Fetched reviews:', data);
        setReviews(data);

        // Tính toán tỷ lệ phần trăm cho mỗi mức sao
        const totalReviews = data.length;
        const starCounts = [0, 0, 0, 0, 0]; // Đếm số lượng đánh giá cho mỗi mức sao
        let totalStars = 0; // Biến để tính tổng số sao

        data.forEach(review => {
          if (review.SoSao) {
            starCounts[review.SoSao - 1]++; // Tăng số lượng cho mức sao tương ứng
            totalStars += review.SoSao; // Cộng dồn số sao
          }
        });

        // Tính toán tỷ lệ phần trăm cho mỗi mức sao
        const percentages = starCounts.map(count => (totalReviews > 0 ? (count / totalReviews) * 100 : 0));
        // Cập nhật trạng thái starPercentages
        setStarPercentages(percentages);

        // Tính số sao trung bình
        const averageStars = totalReviews > 0 ? (totalStars / totalReviews).toFixed(1) : 0;
        setAverageStars(averageStars); // Cập nhật trạng thái cho số sao trung bình
      } catch (error) {
        console.error('Lỗi khi lấy bình luận và đánh giá:', error);
      }
    };

    fetchReviews();
  }, [productId, baseURL]);

  const displayedReviews = isShowAllReviews ?  reviews : reviews.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Bình luận & Đánh giá của khách hàng</h2>
      <div className="flex items-center mb-4">
        <div className="flex">
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1; // Giá trị sao từ 1 đến 5
          if (averageStars >= starValue) {
            return <FaStar key={index} className="w-5 h-5 text-yellow-400 fill-current" />; // Sao đầy đủ
          } else if (averageStars >= starValue - 0.5) {
            return <FaStarHalfAlt key={index} className="w-5 h-5 text-yellow-400 fill-current" />; // Sao phân nửa
          } else {
            return <FaStar key={index} className="w-5 h-5 text-gray-300" />; // Sao rỗng
          }
        })}
        </div>
        <span className="ml-2 text-sm text-gray-600">Đánh giá trung bình của sản phẩm: {averageStars} | 5</span>
      </div>

      <div className="space-y-2 mb-6">
        {starPercentages.map((percentage, index) => (
          <div key={index} className="flex items-center">
            <span className="w-4 text-sm">{index + 1}</span>
            <FaStar className="w-4 h-4 text-yellow-400 fill-current" />
            <div className="w-full bg-gray-200 rounded-full h-2 ml-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {typeof percentage === 'number' && !isNaN(percentage) ? percentage.toFixed(1) : 0}%
            </span>
          </div>
        ))}
      </div>

      <div className="max-h-64 overflow-y-scroll space-y-6">
        {displayedReviews.map((review) => (
          <div key={review.MaBinhLuan} className="border-t pt-6">
            <div className="flex items-center mb-2">
              <img
                src={avatar}
                alt={review.TenNguoiDung}
                className="w-10 h-10 rounded-full mr-4"
              />
              <div>
                <h4 className="font-medium">{review.TenNguoiDung}</h4>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`w-4 h-4 ${i < review.SoSao ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-left text-gray-600">{review.NoiDung}</p>
          </div>
        ))}
      </div>

      {reviews.length > 3 && (
        <button 
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => setIsShowAllReviews(!isShowAllReviews)}
        >
          {isShowAllReviews ? 'Ẩn bớt' : 'Hiển thị tất cả'}
        </button>
      )}
    </div>
  );
};

export default ProductReviews;

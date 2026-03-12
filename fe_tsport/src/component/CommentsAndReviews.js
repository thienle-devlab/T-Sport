import React, { useState } from 'react'
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import avatar from '../img/avatar.jpg'

function CommentsAndReviews({productId}) {
    const [isShowReviewForm, setIsShowReviewForm] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reviews, setReviews] = useState([]);
    const [starPercentages, setStarPercentages] = useState([]);
    const [uniqueReviews, setUniqueReviews] = useState([]);
    const [averageStars, setAverageStars] = useState(0);
    const [isShowAllReviews, setIsShowAllReviews] = useState(false);
    const baseURL = process.env.REACT_APP_API_BASE_URL;

      // Hàm gửi bình luận và đánh giá
      const handleSubmitReview = async (e) => {
        e.preventDefault(); // Ngăn chặn hành vi mặc định của form
    
        const reviewData = {
            MaSanPham: productId, // ID sản phẩm
            SoSao: rating,        // Số sao đánh giá
            NoiDung: comment,     // Nội dung bình luận
        };
    
        console.log('Review Data:', reviewData);
    
        try {
            // Gửi yêu cầu POST để lưu bình luận mới
            const response = await fetch(`${baseURL}/api/save/reviews/`, { //http://localhost:3001/api/save/reviews/
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData),
                credentials: 'include',
            });
    
            // Kiểm tra phản hồi từ server
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                throw new Error('Network response was not ok');
            }
    
            // Lấy bình luận mới sau khi gửi thành công
            const newReview = await response.json();
            console.log('New review:', newReview);
            // Cập nhật trạng thái reviews với bình luận mới
            setReviews((prevReviews) => [...prevReviews, newReview]); // Thêm bình luận mới vào danh sách
    
            // Reset form
            setIsShowReviewForm(false); // Ẩn form bình luận
            setRating(0);               // Reset rating
            setComment('');             // Reset comment
        } catch (error) {
            console.error('Lỗi khi gửi bình luận và đánh giá:', error);
        }
    };
    

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Bình luận & Đánh giá sản phẩm</h3>
        <p className="text-sm text-gray-600 mb-2">
          Bạn có thể nêu cảm nhận và nhận xét trải nghiệm của mình về sản phẩm này của chúng tôi
        </p>
        <button 
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
          onClick={() => setIsShowReviewForm(!isShowReviewForm)}
        >
          Bình luận & Đánh giá
        </button>
      </div>

      {isShowReviewForm && (
        <form onSubmit={handleSubmitReview} className="mb-8 p-4 border rounded-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá của bạn</label>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`w-8 h-8 cursor-pointer ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Bình luận của bạn
            </label>
            <textarea
              id="comment"
              rows="4"
              className="mt-1 block w-full border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Submit
          </button>
        </form>
      )}
    </div>
  )
}

export default CommentsAndReviews
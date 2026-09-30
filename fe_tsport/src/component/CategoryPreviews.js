import { useEffect, useState } from 'react';
import Men from '../img/Men.jpg';
import Women from '../img/Women.jpg';
import Kids from '../img/Kids.jpg';
import { NavLink } from 'react-router-dom';

const img = [
  {
    id: 1,
    imageSrc: Men,
    imageAlt: '',
    href: '#',
  },
  {
    id: 2,
    imageSrc: Women,
    imageAlt: '',
    href: '#',
  },
  {
    id: 3,
    imageSrc: Kids,
    imageAlt: '',
    href: '#',
  },
  
];

function CategoryPreviews() {
  const [popularCategories, setPopularCategories] = useState([]);
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${baseURL}/data/categories`); //http://localhost:3001/data/categories
        const data = await response.json();
        console.log('Fetched data:', data); // Kiểm tra dữ liệu từ API

        if (data && data.categories && typeof data.categories === 'object') {
          const categoriesArray = Object.values(data.categories);
          console.log('Categories array:', categoriesArray); // Kiểm tra dữ liệu sau khi chuyển đổi thành mảng
          const categories = categoriesArray.filter(category => category.MaLoai <= 3);
          setPopularCategories(categories);
        } else {
          console.error('Lỗi dữ liệu:', data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchCategories();
  }, [baseURL]);

  return (
    <div className="bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
          <h2 className="text-2xl font-bold text-gray-900">LOẠI SẢN PHẨM PHỔ BIẾN</h2>

          <div className="mt-6 space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-6 lg:space-y-0">
            {popularCategories.map((category) => (
              <div key={category.MaLoai} className="group relative">
                {img.map((imgItem) => (
                  imgItem.id === category.MaLoai && (
                    <NavLink
                      key={imgItem.id}
                      to={`category/${category.MaLoai}`}
                      className="block w-full h-[500px] border-[1px] aspect-w-1 aspect-h-1 rounded-md overflow-hidden transition-transform duration-300 ease-in-out transform group-hover:scale-95 hover:opacity-75 hover:bg-sky-700"
                    >
                      <img
                        alt={imgItem.imageAlt}
                        src={imgItem.imageSrc}
                        className="w-full h-full object-cover object-center"
                      />
                    </NavLink>
                  )
                ))}
                <h3 className="mt-6 text-sm text-gray-500">
                  <NavLink to={`category/${category.MaLoai}`}>
                    <span className="absolute inset-0" />
                    {category.TenLoai}
                  </NavLink>
                </h3>
                <p className="text-base font-semibold text-gray-900"></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryPreviews;

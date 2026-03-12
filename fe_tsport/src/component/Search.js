import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { NavLink } from 'react-router-dom';

const Search = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Ngăn chặn hành vi mặc định của phím Enter
      if (query.trim() !== '') {
        // Nếu có từ khóa tìm kiếm, chuyển hướng đến trang tìm kiếm
        window.location.href = `/searchitems?query=${encodeURIComponent(query)}`;
      }
    }
  };

  return (
    <div className="relative flex items-center">
      <div className="flex items-center border border-gray-300 rounded-full bg-white">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="w-full px-3 py-2 border-0 rounded-full outline-none focus:ring-0"
        />
        {/* Button to trigger search when clicked */}
        <NavLink
          to={`/searchitems?query=${encodeURIComponent(query)}`}
          className="p-2 text-gray-600"
          onClick={() => onSearch(query)}
        >
          <MagnifyingGlassIcon aria-hidden="true" className="h-4 w-4 text-gray-400" />
        </NavLink>
      </div>
    </div>
  );
};

export default Search;

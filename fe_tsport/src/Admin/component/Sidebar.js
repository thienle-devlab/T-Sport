import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  MdDashboard, 
  MdMenu, 
  MdChevronLeft,
  MdShoppingBasket,
  MdExpandLess,
  MdExpandMore
} from 'react-icons/md';
import _nav from './_nav';
import Logo from '../../img/T-SPORT.png'

const SidebarAd = ({ isCollapsed, toggleCollapse }) => {
    const [openSubMenus, setOpenSubMenus] = useState({});
    const location = useLocation();

    // Cải thiện logic kiểm tra active
    const isRouteActive = (itemPath, subMenus = []) => {
        // Kiểm tra xem đường dẫn hiện tại có match chính xác với item không
        if (location.pathname === itemPath) return true;
        
        // Kiểm tra xem đường dẫn hiện tại có match với bất kỳ submenu nào không
        return subMenus.some(subItem => location.pathname === subItem.to);
    };

    const toggleSubMenu = (name, e) => {
        e.preventDefault(); // Ngăn chặn navigation khi click để mở/đóng submenu
        setOpenSubMenus(prevState => ({
            ...prevState,
            [name]: !prevState[name]
        }));
    };

    return (
        <div 
            className={`bg-gray-900 text-white fixed left-0 top-0 z-30 h-screen
                ${isCollapsed ? 'w-16' : 'w-64'}
                transition-all duration-300 ease-in-out`}
        >
            <div className="flex items-center justify-between p-[14px] border-b border-gray-800">
                {!isCollapsed && (
                    <div className="flex items-center gap-2 overflow-hidden">
                        <img src={Logo} alt="Logo" className="w-14 h-14" />
                        <span className="text-xl font-bold whitespace-nowrap">T-SPORT </span>
                    </div>
                )}
                <button 
                    onClick={toggleCollapse} 
                    className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                >
                    {isCollapsed ? <MdMenu size={24} /> : <MdChevronLeft size={24} />}
                </button>
            </div>
            
            <nav className="mt-4 overflow-y-auto overflow-x-hidden h-[calc(100vh-4rem)]">
                {_nav.map((item, index) => {
                    // Kiểm tra active cho mỗi item
                    const isActive = isRouteActive(item.to, item.subMenu);
                    
                    return (
                        <div key={index}>
                            <div
                                className={`
                                    flex items-center justify-between px-4 py-3 
                                    cursor-pointer hover:bg-gray-800
                                    transition-colors duration-200
                                    ${isActive ? '!bg-blue-600' : ''}
                                `}
                                onClick={(e) => {
                                    if (item.subMenu?.length > 0) {
                                        toggleSubMenu(item.name, e);
                                    }
                                }}
                            >
                                <NavLink
                                    to={item.to}
                                    className="flex items-center min-w-0 flex-1"
                                    onClick={(e) => {
                                        if (item.subMenu?.length > 0) {
                                            e.preventDefault();
                                        }
                                    }}
                                >
                                    <span className="inline-flex shrink-0">{item.icon}</span>
                                    {!isCollapsed && (
                                        <span className="ml-4 whitespace-nowrap overflow-hidden text-ellipsis">
                                            {item.name}
                                        </span>
                                    )}
                                </NavLink>
                                
                                {!isCollapsed && item.subMenu?.length > 0 && (
                                    <span className="shrink-0 ml-2">
                                        {openSubMenus[item.name] ? (
                                            <MdExpandLess size={24} />
                                        ) : (
                                            <MdExpandMore size={24} />
                                        )}
                                    </span>
                                )}
                            </div>
                            
                            {/* SubMenu with animation */}
                            <div 
                                className={`
                                    overflow-hidden transition-all duration-300 ease-in-out bg-gray-800/50
                                    ${openSubMenus[item.name] && !isCollapsed ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                                `}
                            >
                                <div className="pl-8">
                                    {item.subMenu?.map((subItem, subIndex) => (
                                        <NavLink
                                            key={subIndex}
                                            to={subItem.to}
                                            className={({ isActive }) => `
                                                flex items-center px-4 py-2 
                                                cursor-pointer hover:bg-gray-700
                                                transition-colors duration-200
                                                ${isActive ? '!bg-blue-600' : ''}
                                            `}
                                        >
                                            <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                                                {subItem.name}
                                            </span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </nav>
        </div>
    );
};

export default SidebarAd;
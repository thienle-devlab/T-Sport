import React, { useState } from 'react'
import SidebarAd from '../Admin/component/Sidebar'
import NavbarAd from '../Admin/component/Navbar';
import AppRoutesAd from '../Admin/component/routes';

const AdminLayout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <SidebarAd 
        isCollapsed={isCollapsed} 
        toggleCollapse={() => setIsCollapsed(!isCollapsed)} 
      />
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Navbar */}
        <NavbarAd />
        {/* Nội dung chính */}
        <div className="flex-1 p-4 overflow-auto mt-4 pt-16">
          <AppRoutesAd />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
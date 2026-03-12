import React from "react";
import { Routes, Route } from "react-router-dom";
import _nav from "./_nav";


const AppRoutesAd = () => {
    return (
        <Routes>
            {_nav.map((item, index) => (
                <Route 
                    key={index} 
                    path={item.to} 
                    element={<item.component />} 
                />
            ))}
            {_nav.map((item) => 
                item.subMenu.map((subItem, subIndex) => (
                    <Route 
                        key={subIndex} 
                        path={subItem.to} 
                        element={<subItem.component />} 
                    />
                ))
            )}
        </Routes>
    )
}

export default AppRoutesAd
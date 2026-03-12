import React from 'react'
import bg_hero from '../img/bg-hero.jpg'
import { NavLink } from 'react-router-dom'

function Hero() {
  return (
    <div className="relative h-screen">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bg_hero})`
        }}
      ></div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            T-SPORT
          </h1>
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Chất lượng hoàn hảo, phong cách dẫn đầu
          </h2>
          <p className="mt-4 text-xl">
            Chúng tôi chuyển cung cấp các dòng sản phẩm chuyên về thể thao
          </p>
          <div className="mt-10">
            <NavLink
              to={'/productslist'}
              className="inline-block rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-center font-medium text-white hover:bg-indigo-700"
            >
              Let's Go
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
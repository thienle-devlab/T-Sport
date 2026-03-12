import React from 'react'
import logo_nike from '../img/logo-nike.png'
import logo_adidas from '../img/logo-adidas.png'
import logo_puma from '../img/logo-puma.png'
import logo_reebok from '../img/logo-reebok.png'
import logo_nb from '../img/logo-nb.png'
import { NavLink } from 'react-router-dom'

function LogoClouds() {
  return (
    <div className="bg-gray-100 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-center text-lg font-semibold leading-8 text-gray-900">
          CÁC THƯƠNG HIỆU VỀ THỂ THAO HÀNG ĐẦU THẾ GIỚI
        </h2>
        <div className="mx-auto mt-10 grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5">
          <NavLink to='http://localhost:3000/category/5'>
            <img
              alt="Transistor"
              src={logo_nike}
              width={158}
              height={48}
              className="col-span-2 col-start-2 max-h-12 w-full object-contain sm:col-start-auto lg:col-span-1 transition duration-300 ease-in-out hover:scale-110 hover:opacity-80"
            />
          </NavLink>

          <NavLink to='http://localhost:3000/category/4'>
            <img
              alt="Reform"
              src={logo_adidas}
              width={158}
              height={48}
              className="col-span-2 col-start-2 max-h-12 w-full object-contain sm:col-start-auto lg:col-span-1 transition duration-300 ease-in-out hover:scale-110 hover:opacity-80"
            />
          </NavLink>
          
          <NavLink to='http://localhost:3000/category/9'>
            <img
              alt="Tuple"
              src={logo_puma}
              width={158}
              height={48}
              className="col-span-2 col-start-2 max-h-12 w-full object-contain sm:col-start-auto lg:col-span-1 transition duration-300 ease-in-out hover:scale-110 hover:opacity-80"
            />
          </NavLink>

          <NavLink to='http://localhost:3000/category/8'>
            <img
              alt="SavvyCal"
              src={logo_reebok}
              width={158}
              height={48}
              className="col-span-2 col-start-2 max-h-12 w-full object-contain sm:col-start-auto lg:col-span-1 transition duration-300 ease-in-out hover:scale-110 hover:opacity-80"
            />
          </NavLink>

          <NavLink to='http://localhost:3000/category/6'>
            <img
              alt="Statamic"
              src={logo_nb}
              width={158}
              height={48}
              className="col-span-2 col-start-2 max-h-12 w-full object-contain sm:col-start-auto lg:col-span-1 transition duration-300 ease-in-out hover:scale-110 hover:opacity-80"
            />
          </NavLink>
        </div>
      </div>
    </div>
  )
}

export default LogoClouds
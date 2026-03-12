import React from 'react'

import logo_fb from '../img/logo-facebook.png'
import logo_instagram from '../img/logo-instagram.png'
import logo_tiktok from '../img/logo-tiktok.png'
import logo_github from '../img/logo-github.png'
import logo_twitter from '../img/logo-twitter.png'
import { NavLink } from 'react-router-dom'

function Footer() {
    return (
        <div className="bg-indigo-600 py-8">
            <div className="container mx-auto px-4">
                <div className="flex flex-wrap justify-center mb-6">
                    <NavLink to={'#'} className="mx-3 text-white hover:text-gray-800">Home</NavLink>
                    <NavLink to={'#'} className="mx-3 text-white hover:text-gray-800">Men</NavLink>
                    <NavLink to={'#'} className="mx-3 text-white hover:text-gray-800">Women</NavLink>
                    <NavLink to={'#'} className="mx-3 text-white hover:text-gray-800">Kids</NavLink>
                    <NavLink to={'#'} className="mx-3 text-white hover:text-gray-800">About</NavLink>
                </div>

                <div className="flex justify-center mb-6">
                    <NavLink to={'#'} className="mx-2"><img src={logo_fb} alt="Facebook" className="h-6 w-6" /></NavLink>
                    <NavLink to={'#'} className="mx-2"><img src={logo_instagram} alt="Instagram" className="h-6 w-6" /></NavLink>
                    <NavLink to={'#'} className="mx-2"><img src={logo_tiktok} alt="Tiktok" className="h-6 w-6" /></NavLink>
                    <NavLink to={'#'} className="mx-2"><img src={logo_github} alt="GitHub" className="h-6 w-6" /></NavLink>
                    <NavLink to={'#'} className="mx-2"><img src={logo_twitter} alt="Twitter" className="h-6 w-6" /></NavLink>
                </div>

                <div className="text-center text-white text-sm">
                    © 2024 LePhuocThien, Inc. All rights reserved.
                </div>
            </div>
        </div>
    )
}

export default Footer
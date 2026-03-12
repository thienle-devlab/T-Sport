import React, { useEffect } from 'react'
import Hero from '../component/Hero'
import CategoryPreviews from '../component/CategoryPreviews'
import ProductsList from '../component/ProductsList'
import LogoClouds from '../component/LogoClouds'

function Home() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    return (
        <div>
            <Hero />
            <CategoryPreviews />
            <ProductsList />
            <LogoClouds />
        </div>
    )
}

export default Home
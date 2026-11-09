import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Star, ShieldCheck, Clock, Sparkles, Heart, Leaf, Truck, Award, Cake } from 'lucide-react';
import { motion } from 'motion/react';

export const HomePage: React.FC = () => {
  const { setCurrentView, setSelectedProductId, products, addToCart, settings } = useApp();

  const featuredProducts = products.filter(p => p.featured).slice(0, 4);
  const bestsellers = products.filter(p => p.bestseller).slice(0, 4);

  const benefits = [
    {
      icon: Leaf,
      title: 'Fresh Ingredients',
      desc: 'Always',
    },
    {
      icon: Truck,
      title: 'Fast & Safe',
      desc: 'Delivery',
    },
    {
      icon: Award,
      title: 'Premium Quality',
      desc: 'Products',
    },
    {
      icon: Cake,
      title: 'Custom Cakes',
      desc: 'Available',
    },
  ];

  return (
    <div className="w-full overflow-hidden">
      
      {/* Unified Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#FAF5EF] via-[#FDFBF7] to-[#F7F1E8] border-b border-[#E8DFD5]/70">
        {/* Soft Ambient Bakery Lighting */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#C5A46D]/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-[420px] h-[420px] bg-[#762F3D]/8 rounded-full blur-3xl pointer-events-none" />

        {/* Delicate Corner Botanical Flourish */}
        <div className="absolute top-0 left-0 pointer-events-none opacity-20 sm:opacity-30 select-none">
          <svg width="180" height="200" viewBox="0 0 180 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-20 0C30 40 50 90 40 140C70 100 80 50 60 0" stroke="#C5A46D" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M40 50C60 40 85 45 95 65C80 80 55 75 40 50Z" fill="#F4EAE0" stroke="#C5A46D" strokeWidth="1.2" />
            <path d="M45 95C70 85 95 95 100 115C80 128 58 118 45 95Z" fill="#F4EAE0" stroke="#C5A46D" strokeWidth="1.2" />
            <path d="M35 140C60 135 85 148 90 168C70 176 50 162 35 140Z" fill="#F4EAE0" stroke="#C5A46D" strokeWidth="1.2" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-12 sm:pb-14 lg:pt-16 lg:pb-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
            
            {/* Left Content Column */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.14,
                    delayChildren: 0.1
                  }
                }
              }}
              className="lg:col-span-6 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start"
            >
              {/* Badge */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: -10 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
                }}
                className="inline-flex items-center gap-2 bg-[#762F3D]/8 border border-[#762F3D]/15 text-[#762F3D] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C5A46D]" />
                <span className="font-sans">Artisan Bakery of {settings.city ? settings.city.split(',')[0].trim() : 'Lahore'}</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                variants={{
                  hidden: { opacity: 0, y: 22 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } }
                }}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-[68px] font-bold text-[#302421] leading-[1.08] tracking-tight"
              >
                Freshly Baked <br />
                <span className="text-[#762F3D]">With Love</span>
              </motion.h1>

              {/* Supporting Description */}
              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
                }}
                className="text-sm sm:text-base lg:text-[17px] text-[#6E605B] leading-relaxed max-w-lg font-normal"
              >
                Delicious cakes, pastries and more, freshly baked for every occasion with love and the finest ingredients.
              </motion.p>

              {/* Primary CTA */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
                }}
                className="pt-2 w-full sm:w-auto"
              >
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 12px 28px -5px rgba(118, 47, 61, 0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCurrentView('products')}
                  className="w-full sm:w-auto bg-[#762F3D] hover:bg-[#5F2030] text-white px-8 py-4 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md cursor-pointer inline-flex items-center justify-center gap-2.5 group"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Right Cake Image Column */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.85, ease: 'easeOut', delay: 0.2 }}
              className="lg:col-span-6 flex justify-center items-center relative"
            >
              <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl">
                {/* Warm golden backlight glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-[#C5A46D]/25 via-[#762F3D]/10 to-amber-100/30 rounded-full blur-3xl pointer-events-none" />

                {/* Floating motion container */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 5.5,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut'
                  }}
                  className="relative overflow-hidden rounded-3xl bg-[#FAF7F2] border border-[#E8DFD5] shadow-2xl group"
                >
                  <img
                    src="/assets/luxury_berry_cake.png"
                    alt="Luxury Celebration Cake with Fresh Berries and Cream"
                    className="w-full h-[320px] sm:h-[400px] lg:h-[450px] object-cover object-center transform group-hover:scale-103 transition duration-700 ease-out"
                    loading="eager"
                  />
                  {/* Subtle bottom vignette to blend naturally */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />

                  {/* Floating Trust Badge */}
                  <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg border border-[#E8DFD5] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#762F3D] text-[#C5A46D] flex items-center justify-center font-bold text-xs font-serif shadow-xs">
                      ★
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[#302421] leading-tight">100% Fresh Artisan Bakes</div>
                      <div className="text-[10px] text-[#80736F] leading-tight mt-0.5">Handcrafted Daily in {settings.city ? settings.city.split(',')[0].trim() : 'Lahore'}</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Continuous Horizontal Marquee Section (Left to Right) */}
      <section className="relative w-full bg-[#FAF5EE] border-b border-[#E8DFD5] py-3.5 sm:py-4 overflow-hidden">
        {/* Soft edge blur masks for a seamless infinite ribbon look */}
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#FAF5EE] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#FAF5EE] to-transparent z-10 pointer-events-none" />

        {/* Continuous Left-to-Right Marquee Ribbon */}
        <div className="overflow-hidden">
          <div className="animate-marquee-ltr flex items-center">
            {/* Duplicated tracks create the infinite seamless loop */}
            {[0, 1].map((copyIndex) => (
              <div key={copyIndex} className="flex items-center shrink-0">
                {/* Repeat twice per track to ensure wide-screen coverage */}
                {[0, 1].map((subIndex) => (
                  <React.Fragment key={`${copyIndex}-${subIndex}`}>
                    {benefits.map((item, bIdx) => {
                      const Icon = item.icon;
                      return (
                        <div key={bIdx} className="flex items-center">
                          <div className="flex items-center gap-3.5 mx-5 sm:mx-8 whitespace-nowrap">
                            <div className="w-9 h-9 rounded-full bg-[#762F3D]/10 text-[#762F3D] flex items-center justify-center shrink-0 border border-[#762F3D]/15 shadow-2xs">
                              <Icon className="w-4 h-4 text-[#762F3D]" />
                            </div>
                            <div className="text-left flex flex-col">
                              <span className="font-sans font-bold text-xs sm:text-[13px] text-[#302421] tracking-tight">
                                {item.title}
                              </span>
                              <span className="text-[11px] text-[#80736F] font-medium leading-tight">
                                {item.desc}
                              </span>
                            </div>
                          </div>
                          <div className="h-5 w-px bg-[#E8DFD5]" />
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Home Page Content Container */}
      <div className="space-y-16 mt-12 sm:mt-16 pb-20 overflow-hidden">

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#762F3D] font-bold">Handcrafted Fresh</span>
            <h2 className="font-serif text-3xl font-bold text-[#302725] mt-1">Featured Products</h2>
          </div>
          <button
            onClick={() => setCurrentView('products')}
            className="text-xs font-bold text-[#762F3D] hover:underline flex items-center gap-1"
          >
            View All ({products.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              className="bg-white rounded-2xl overflow-hidden border border-[#E8E0D9] shadow-xs hover:shadow-xl transition group flex flex-col"
            >
              <div className="relative overflow-hidden h-56 bg-[#FAF7F2]">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <button
                  onClick={() => { setSelectedProductId(product.id); setCurrentView('product-detail'); }}
                  className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-semibold text-xs bg-black/20"
                >
                  Quick View
                </button>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 text-xs mb-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold text-[#302725]">{product.rating}</span>
                    <span className="text-[#80736F]">({product.reviewsCount})</span>
                  </div>
                  <h3
                    onClick={() => { setSelectedProductId(product.id); setCurrentView('product-detail'); }}
                    className="font-serif font-bold text-base text-[#302725] hover:text-[#762F3D] cursor-pointer"
                  >
                    {product.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8E0D9]">
                  <div className="font-bold text-base text-[#762F3D]">
                    Rs. {product.price.toLocaleString()}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addToCart(product)}
                    className="bg-[#762F3D] hover:bg-[#5F2030] text-white p-2.5 rounded-xl transition shadow"
                    title="Add to Cart"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Custom Cake Promotion Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-[#762F3D] text-white rounded-3xl p-6 sm:p-12 relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="absolute right-0 top-0 w-96 h-96 bg-[#C5A46D]/10 rounded-full blur-3xl"></div>
          
          <div className="space-y-4 max-w-xl z-10 text-center md:text-left flex flex-col items-center md:items-start">
            <span className="bg-[#C5A46D] text-[#302725] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Personalized Magic
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
              Custom Cakes for Your Special Moments
            </h2>
            <p className="text-xs sm:text-sm text-[#F3E6DF] leading-relaxed">
              Birthdays, Weddings, Anniversaries, and more. Upload your dream cake design or describe your vision, and our master bakers will bring it to life!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView('custom-cake')}
              className="bg-[#C5A46D] hover:bg-[#B4935C] text-[#302725] px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
            >
              Request Custom Cake
            </motion.button>
          </div>

          <div className="z-10 shrink-0 w-full md:w-auto flex justify-center">
            <img
              src="/assets/custom_wedding_cake.jpg"
              alt="Custom Wedding Cake"
              className="w-56 h-56 sm:w-72 sm:h-72 max-w-full object-cover rounded-2xl shadow-2xl border-4 border-[#C5A46D]/40"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('unsplash')) {
                  target.src = 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=800&q=80';
                }
              }}
            />
          </div>
        </motion.div>
      </section>

      {/* Bestsellers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#762F3D] font-bold">Customer Favorites</span>
          <h2 className="font-serif text-3xl font-bold text-[#302725] mt-1">Bestsellers</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestsellers.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              className="bg-white rounded-2xl overflow-hidden border border-[#E8E0D9] shadow-xs hover:shadow-xl transition group flex flex-col"
            >
              <div className="relative overflow-hidden h-56 bg-[#FAF7F2]">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3
                    onClick={() => { setSelectedProductId(product.id); setCurrentView('product-detail'); }}
                    className="font-serif font-bold text-base text-[#302725] hover:text-[#762F3D] cursor-pointer"
                  >
                    {product.name}
                  </h3>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#E8E0D9]">
                  <div className="font-bold text-base text-[#762F3D]">
                    Rs. {product.price.toLocaleString()}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addToCart(product)}
                    className="bg-[#762F3D] hover:bg-[#5F2030] text-white p-2.5 rounded-xl transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Story & Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E0D9]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs uppercase tracking-widest text-[#762F3D] font-bold">Our Story</span>
              <h2 className="font-serif text-3xl font-bold text-[#302725]">
                Handcrafted Perfection Since 2018
              </h2>
              <p className="text-sm text-[#80736F] leading-relaxed">
                We started {settings.bakeryName || 'The Cake House'} with a simple dream — to bring happiness through cakes. Today, we are proud to be Pakistan’s favorite artisan bakery, serving fresh, delicious, and beautifully crafted treats across {settings.city ? settings.city.split(',')[0].trim() : 'Lahore'}.
              </p>
              <button
                onClick={() => setCurrentView('about')}
                className="bg-[#762F3D] hover:bg-[#5F2030] text-white px-6 py-3 rounded-xl font-semibold text-xs transition"
              >
                Learn More About Us
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80"
                alt="Bakery Croissants"
                className="rounded-2xl object-cover h-48 w-full shadow"
              />
              <img
                src="https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80"
                alt="Cupcakes"
                className="rounded-2xl object-cover h-48 w-full shadow mt-6"
              />
            </div>
          </div>
        </motion.div>
      </section>

    </div>
    </div>
  );
};

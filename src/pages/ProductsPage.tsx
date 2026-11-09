import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/mockData';
import { Search, Check, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { Product } from '../types';
import { Dropdown } from '../components/Dropdown';

export const ProductsPage: React.FC = () => {
  const { products, categories, setSelectedProductId, setCurrentView, addToCart } = useApp();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [maxPrice, setMaxPrice] = useState(7000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Dynamic category options from DB
  const displayCategories = [
    { id: 'all', name: 'All Products' },
    ...categories.map(c => ({ id: c.name, name: c.name }))
  ];

  // Helper to resolve genuine high-res product image with graceful fallback
  const getProductImage = (product: Product): string => {
    if (product.images && product.images.length > 0 && product.images[0]) {
      return product.images[0];
    }
    if (product.category === 'cakes' || product.name.toLowerCase().includes('cake')) {
      return '/assets/luxury_berry_cake.png';
    }
    return '/assets/artisan_hero_cake.png';
  };

  const handleAddToCart = (product: Product) => {
    if (!product.inStock) return;
    addToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(prev => (prev === product.id ? null : prev));
    }, 1200);
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setMaxPrice(7000);
    setInStockOnly(false);
  };

  const hasActiveFilters = selectedCategory !== 'all' || searchQuery.trim() !== '' || maxPrice < 7000 || inStockOnly;

  // Filter & Sort
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = product.price <= maxPrice;
    const matchesStock = !inStockOnly || product.inStock;
    return matchesCategory && matchesSearch && matchesPrice && matchesStock;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.reviewsCount - a.reviewsCount; // popularity
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16">
      
      {/* 1. Header Section: Breadcrumb + Title & Subtitle + Compact Search & Sort Toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-2 border-b border-[#E8E0D9]/60">
        <div>
          {/* Breadcrumb Navigation */}
          <div className="text-[11px] text-[#80736F] mb-1.5 flex items-center gap-1.5 font-medium">
            <button onClick={() => setCurrentView('home')} className="hover:text-[#762F3D] transition">Home</button>
            <span className="text-[#D9CFC4]">/</span>
            <span className="text-[#302725] font-semibold">Products</span>
          </div>

          {/* Heading & Subtitle */}
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#302725] tracking-tight">
            Our Products
          </h1>
          <p className="text-xs sm:text-sm text-[#80736F] mt-1 font-normal max-w-md">
            Handcrafted cakes, artisan pastries, and daily fresh bakes made with love.
          </p>
        </div>

        {/* Compact, Elegant Toolbar (Aligned horizontally with bottom of heading) */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          
          {/* Compact Search Field */}
          <div className="relative flex-1 sm:flex-none min-w-[120px]">
            <Search className="w-3.5 h-3.5 text-[#80736F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-44 focus:sm:w-52 bg-white border border-[#E8E0D9] rounded-xl pl-8 pr-7 py-2 text-xs text-[#302725] placeholder:text-[#80736F]/70 focus:outline-none focus:border-[#762F3D] focus:ring-1 focus:ring-[#762F3D]/20 transition-all shadow-2xs h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#80736F] hover:text-[#302725] p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Compact Sort Dropdown */}
          <Dropdown
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'popularity', label: 'Popularity' },
              { value: 'price-low', label: 'Price: Low to High' },
              { value: 'price-high', label: 'Price: High to Low' },
              { value: 'rating', label: 'Top Rated' },
            ]}
            size="sm"
            buttonClassName="rounded-xl bg-white border border-[#E8E0D9] text-[#302725] font-semibold text-xs h-9 px-3 hover:border-[#762F3D]/40 transition shadow-2xs"
            align="right"
            className="shrink-0"
          />

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className={`lg:hidden h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              hasActiveFilters ? 'bg-[#762F3D] text-white border-[#762F3D] shadow-xs' : 'bg-white text-[#302725] border-[#E8E0D9] hover:bg-[#FAF7F2]'
            }`}
            title="Filter by Price & Stock"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Horizontal Category Quick Scroll */}
      <div className="lg:hidden mb-4 -mx-4 px-4 overflow-x-auto scrollbar-none flex items-center gap-2">
        {displayCategories.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
                isSelected
                  ? 'bg-[#762F3D] text-white shadow-xs'
                  : 'bg-white text-[#302725] border border-[#E8E0D9] hover:bg-[#FAF7F2]'
              }`}
            >
              {cat.name}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-[#5F2030] text-white' : 'bg-[#FAF7F2] text-[#80736F]'}`}>
                {cat.id === 'all' ? products.length : products.filter(p => p.category.toLowerCase() === cat.id.toLowerCase()).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Filter Sheet (Collapsible) */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden bg-white rounded-2xl border border-[#E8E0D9] p-4 shadow-sm mb-5 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D9]">
              <h4 className="font-serif font-bold text-sm text-[#302725]">Filter Products</h4>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="text-xs text-[#762F3D] font-bold"
              >
                Apply
              </button>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-semibold text-[#80736F]">Price Limit</span>
                <span className="font-bold text-[#762F3D]">Rs. {maxPrice.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="7000"
                step="250"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#762F3D] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#80736F] mt-0.5">
                <span>Rs. 500</span>
                <span>Rs. 7,000</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-[#302725] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => setInStockOnly(e.target.checked)}
                  className="accent-[#762F3D] w-4 h-4 rounded cursor-pointer"
                />
                <span className="font-medium">In Stock Only</span>
              </label>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-[#762F3D] hover:underline font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Layout: Clean Sidebar + Product Grid */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-7 items-start">
        
        {/* Left Sidebar — Sticky with safe offset (top-32) so it never gets hidden under sticky header */}
        <aside className="hidden lg:block w-[215px] sm:w-[225px] shrink-0 sticky top-32 space-y-4">
          <div className="bg-white p-4.5 rounded-2xl border border-[#E8E0D9] shadow-xs space-y-4">
            
            {/* Categories Header */}
            <div className="flex items-center justify-between border-b border-[#E8E0D9]/80 pb-2.5">
              <h3 className="font-serif font-bold text-xs text-[#80736F] uppercase tracking-wider">
                Categories
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-[#762F3D] hover:underline flex items-center gap-1 font-semibold"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Reset
                </button>
              )}
            </div>

            {/* Category Links with active burgundy styling */}
            <div className="space-y-1">
              {displayCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex justify-between items-center transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#762F3D] text-white shadow-xs'
                      : 'hover:bg-[#FAF7F2] text-[#302725] hover:text-[#762F3D]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    selectedCategory === cat.id ? 'bg-[#5F2030] text-white' : 'bg-[#FAF7F2] text-[#80736F]'
                  }`}>
                    {cat.id === 'all' ? products.length : products.filter(p => p.category.toLowerCase() === cat.id.toLowerCase()).length}
                  </span>
                </button>
              ))}
            </div>

            <hr className="border-[#E8E0D9]" />

            {/* Price Limit Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <h4 className="text-[11px] font-bold text-[#80736F] uppercase tracking-wider">
                  Price Limit
                </h4>
                <span className="text-xs font-bold text-[#762F3D]">
                  Rs. {maxPrice.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="7000"
                step="250"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#762F3D] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#80736F] mt-1 font-medium">
                <span>Rs. 500</span>
                <span>Rs. 7,000</span>
              </div>
            </div>

            <hr className="border-[#E8E0D9]" />

            {/* Availability Checkbox */}
            <div>
              <label className="flex items-center gap-2 text-xs text-[#302725] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => setInStockOnly(e.target.checked)}
                  className="accent-[#762F3D] w-3.5 h-3.5 rounded cursor-pointer"
                />
                <span className="font-semibold">In Stock Only</span>
              </label>
            </div>

          </div>
        </aside>

        {/* Right Main Content — Responsive Product Grid */}
        <main className="flex-1 min-w-0">
          
          {filteredProducts.length === 0 ? (
            <div className="bg-white py-14 px-6 rounded-2xl border border-[#E8E0D9] text-center space-y-3.5 shadow-xs">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#FAF7F2] border border-[#E8E0D9] flex items-center justify-center text-[#762F3D]">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#302725]">No products found</h3>
              <p className="text-xs text-[#80736F] max-w-xs mx-auto">
                No items match your active filters. Try searching for another keyword or reset filters.
              </p>
              <button
                onClick={resetFilters}
                className="bg-[#762F3D] hover:bg-[#5F2030] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            /* Product Grid: 3 columns on desktop, 2 on tablet, 2 on mobile for balanced visual browsing */
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 lg:gap-6">
              {filteredProducts.map((product, index) => {
                const isAdded = addedProductId === product.id;
                const imageUrl = getProductImage(product);

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.18) }}
                    whileHover={{ y: -3 }}
                    className="group flex flex-col justify-between"
                  >
                    {/* Compact Rounded Square Product Image */}
                    <div
                      onClick={() => { setSelectedProductId(product.id); setCurrentView('product-detail'); }}
                      className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#F5EFEB] border border-[#E8E0D9]/80 shadow-[0_2px_8px_rgba(48,39,37,0.04)] group-hover:shadow-[0_8px_20px_rgba(48,39,37,0.08)] group-hover:border-[#762F3D]/25 transition-all duration-300 cursor-pointer"
                    >
                      <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.includes('luxury_berry_cake.png')) {
                            target.src = '/assets/luxury_berry_cake.png';
                          }
                        }}
                      />

                      {/* Out of Stock overlay badge */}
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="bg-red-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Compact Product Details Section */}
                    <div className="pt-2 sm:pt-2.5 flex flex-col flex-1 justify-between">
                      <div>
                        {/* Elegant Serif Product Title */}
                        <h3
                          onClick={() => { setSelectedProductId(product.id); setCurrentView('product-detail'); }}
                          className="font-serif font-bold text-xs sm:text-sm md:text-[15px] text-[#2D2321] group-hover:text-[#762F3D] transition-colors cursor-pointer tracking-tight leading-snug line-clamp-1"
                          title={product.name}
                        >
                          {product.name}
                        </h3>

                        {/* Burgundy PKR Price */}
                        <p className="font-semibold text-xs sm:text-sm text-[#762F3D] mt-0.5 tracking-tight">
                          Rs. {product.price.toLocaleString()}
                        </p>
                      </div>

                      {/* Burgundy Add to Cart Button */}
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.inStock}
                        className={`mt-2 sm:mt-2.5 w-full py-2 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${
                          !product.inStock
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : isAdded
                            ? 'bg-[#2E6B47] text-white shadow-xs'
                            : 'bg-[#762F3D] hover:bg-[#5F2030] text-white hover:shadow-xs'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Added</span>
                          </>
                        ) : (
                          <span>Add to Cart</span>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </main>

      </div>

    </div>
  );
};

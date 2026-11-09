import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Star, ShieldCheck, Clock, Check, Plus, Minus, ShoppingBag, Sparkles, Truck, Heart } from 'lucide-react';
import { Product } from '../types';

export const ProductDetailPage: React.FC = () => {
  const { products, selectedProductId, setCurrentView, addToCart, requireAuth, setCheckoutModalOpen, settings } = useApp();
  
  const product: Product = products.find(p => p.id === selectedProductId) || products[0];

  // Helper to resolve genuine high-res product images with graceful fallback
  const getCleanImages = (prod: Product): string[] => {
    const valid = (prod.images || []).filter(img => img && !img.includes('photo-1535141192574'));
    if (valid.length > 0) return valid;
    if (prod.category === 'cakes' || prod.name.toLowerCase().includes('cake')) {
      return ['/assets/luxury_berry_cake.png', '/assets/artisan_hero_cake.png'];
    }
    return ['/assets/artisan_hero_cake.png'];
  };

  const images = getCleanImages(product);

  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0]?.size || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(images[0]);
  const [added, setAdded] = useState(false);

  // Synchronize state whenever a different product is selected
  useEffect(() => {
    if (product) {
      const cleanImgs = getCleanImages(product);
      setActiveImage(cleanImgs[0]);
      setSelectedVariant(product.variants?.[0]?.size || '');
      setQuantity(1);
      setAdded(false);
    }
  }, [product?.id]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-[#302725]">Product not found</h2>
        <button
          onClick={() => setCurrentView('products')}
          className="bg-[#762F3D] text-white px-5 py-2 rounded-xl text-xs font-semibold"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const currentVariantObj = product.variants?.find(v => v.size === selectedVariant);
  const currentPrice = currentVariantObj ? currentVariantObj.price : product.price;

  const handleAddToCart = () => {
    if (!product.inStock) return;
    addToCart(product, selectedVariant, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const handleBuyNow = () => {
    if (!product.inStock) return;
    addToCart(product, selectedVariant, quantity);
    if (requireAuth(`Create an account or sign in to complete your order with ${settings.bakeryName || 'The Cake House'}.`, true)) {
      setCheckoutModalOpen(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 sm:pt-6">
      
      {/* 1. Breadcrumbs — Compact & Clean */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#80736F] mb-4 sm:mb-5 flex items-center gap-1.5">
        <button onClick={() => setCurrentView('home')} className="hover:text-[#762F3D] transition">Home</button>
        <span>&gt;</span>
        <button onClick={() => setCurrentView('products')} className="hover:text-[#762F3D] capitalize transition">
          {product.category || 'Products'}
        </button>
        <span>&gt;</span>
        <span className="text-[#302725] font-semibold truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* 2. Compact Two-Column Layout (Matching IMAGE 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: Main Image + Thumbnail Gallery + Compact Benefits */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Main Product Image */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#F5EFEB] border border-[#E8E0D9]/80 shadow-[0_2px_12px_rgba(48,39,37,0.05)]">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('luxury_berry_cake.png')) {
                  target.src = '/assets/luxury_berry_cake.png';
                }
              }}
            />

            {!product.inStock && (
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-md">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery Underneath */}
          {images.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImage === img
                      ? 'border-[#762F3D] ring-2 ring-[#762F3D]/20 shadow-xs scale-102'
                      : 'border-[#E8E0D9] opacity-75 hover:opacity-100 hover:border-[#762F3D]/40'
                  }`}
                  aria-label={`View photo ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('luxury_berry_cake.png')) {
                        target.src = '/assets/luxury_berry_cake.png';
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Compact Product Benefits Box */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#E8E0D9]/80 shadow-2xs space-y-2 text-xs">
            <div className="flex items-center gap-2.5 text-[#302725]">
              <span className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#E8E0D9] flex items-center justify-center text-[#762F3D] shrink-0 text-sm">
                🍃
              </span>
              <span className="font-medium text-[11px] sm:text-xs">Fresh Artisan Ingredients</span>
            </div>
            <div className="flex items-center gap-2.5 text-[#302725]">
              <span className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#E8E0D9] flex items-center justify-center text-[#762F3D] shrink-0 text-sm">
                🚚
              </span>
              <span className="font-medium text-[11px] sm:text-xs">Free Delivery in Lahore on Orders Above Rs. 3,000</span>
            </div>
            <div className="flex items-center gap-2.5 text-[#302725]">
              <span className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#E8E0D9] flex items-center justify-center text-[#762F3D] shrink-0 text-sm">
                🎂
              </span>
              <span className="font-medium text-[11px] sm:text-xs">Handcrafted Daily with Love</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Details & Purchase Controls */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-7 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-4">
          
          {/* Category Badge & Product Name */}
          <div>
            <span className="inline-block bg-[#762F3D]/10 text-[#762F3D] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5">
              {product.category}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#302725] tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Price in PKR */}
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#762F3D] mt-1.5 tracking-tight">
              Rs. {currentPrice.toLocaleString()}
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-2 mt-2 text-xs">
              <div className="flex text-amber-500 tracking-tight">
                {'★'.repeat(Math.round(product.rating || 5))}
                {'☆'.repeat(5 - Math.round(product.rating || 5))}
              </div>
              <span className="font-bold text-[#302725]">({product.rating})</span>
              <span className="text-[#80736F]">({product.reviewsCount} customer reviews)</span>
            </div>
          </div>

          <hr className="border-[#E8E0D9]/80" />

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-[#80736F] leading-relaxed">
            {product.description}
          </p>

          {/* Size & Weight Options */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#302725]">
                Available Sizes & Weights
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => {
                  const isSelected = selectedVariant === v.size;
                  return (
                    <button
                      key={v.size}
                      type="button"
                      onClick={() => setSelectedVariant(v.size)}
                      className={`py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#762F3D] text-white border-[#762F3D] shadow-2xs'
                          : 'bg-[#FAF7F2] text-[#302725] border-[#E8E0D9] hover:bg-[#F3E6DF]'
                      }`}
                    >
                      <span>{v.size}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-[#F3E6DF]' : 'text-[#80736F]'}`}>
                        ({v.weight})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector & Purchase Buttons */}
          <div className="pt-2 space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#302725]">
              Quantity
            </label>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2.5 flex-1">
                {/* Compact Quantity Stepper */}
                <div className="flex items-center border border-[#E8E0D9] rounded-xl bg-[#FAF7F2] p-0.5 shrink-0 h-10">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-full flex items-center justify-center text-[#80736F] hover:text-[#302725] hover:bg-white rounded-lg transition cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-[#302725]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-full flex items-center justify-center text-[#80736F] hover:text-[#302725] hover:bg-white rounded-lg transition cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`flex-1 h-10 px-4 rounded-xl font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                    !product.inStock
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : added
                      ? 'bg-[#2E6B47] text-white shadow-xs'
                      : 'bg-[#762F3D] hover:bg-[#5F2030] text-white hover:shadow-sm'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#C5A46D]" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>

              {/* Buy Now Button */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="w-full sm:w-auto h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 bg-[#C5A46D] hover:bg-[#B4935C] text-[#302725] shadow-2xs hover:shadow-xs disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* Ingredients & Allergens Information */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="pt-3 border-t border-[#E8E0D9]/80 space-y-2 text-xs">
              <div className="font-bold text-[#302725] text-[11px] uppercase tracking-wider">
                Ingredients & Allergens
              </div>
              <div className="flex flex-wrap gap-1.5">
                {product.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="inline-block bg-[#FAF7F2] text-[#80736F] border border-[#E8E0D9] px-2 py-0.5 rounded-lg text-[11px]"
                  >
                    {ing}
                  </span>
                ))}
                {product.allergens && product.allergens.map((all, i) => (
                  <span
                    key={`all-${i}`}
                    className="inline-block bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg text-[11px] font-medium"
                  >
                    Contains: {all}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

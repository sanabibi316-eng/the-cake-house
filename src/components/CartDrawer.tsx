import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    checkoutModalOpen,
    setCheckoutModalOpen,
    requireAuth,
    settings
  } = useApp();

  if (!isCartOpen) {
    if (checkoutModalOpen) {
      return <CheckoutModal onClose={() => setCheckoutModalOpen(false)} />;
    }
    return null;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeThreshold = settings.freeDeliveryThreshold ?? 3500;
  const standardFee = settings.deliveryFee ?? 250;
  const deliveryFee = subtotal >= freeThreshold || subtotal === 0 ? 0 : standardFee;
  const total = subtotal + deliveryFee;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    // Check authentication. If guest, redirect to AuthModal with message and save checkout intent
    if (requireAuth(`Create an account or sign in to place your order with ${settings.bakeryName || 'The Cake House'}.`, true)) {
      setCheckoutModalOpen(true);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
        <div className="w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col border-l border-[#E8E0D9] animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 bg-white border-b border-[#E8E0D9] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#762F3D]" />
              <h3 className="font-serif font-bold text-lg text-[#302725]">Your Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</h3>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-[#80736F] hover:text-[#302725] rounded-full hover:bg-[#FAF7F2] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-[#E8E0D9]">
            {cart.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 bg-[#F3E6DF] rounded-full flex items-center justify-center mx-auto text-[#762F3D]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-serif font-semibold text-lg text-[#302725]">Your cart is empty</h4>
                <p className="text-xs text-[#80736F]">Explore our delicious cakes, pastries and treats to add items to your cart.</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="bg-[#762F3D] text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-[#5F2030] transition"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="pt-4 first:pt-0 flex gap-4 items-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-xl border border-[#E8E0D9] shrink-0"
                  />
                  <div className="flex-1">
                    <h5 className="font-serif font-semibold text-sm text-[#302725] leading-snug">{item.name}</h5>
                    <div className="text-xs font-bold text-[#762F3D] mt-1">Rs. {item.price.toLocaleString()}</div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-[#E8E0D9] rounded bg-white">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-[#80736F] hover:text-[#302725]"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-[#80736F] hover:text-[#302725]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cart.length > 0 && (
            <div className="p-5 bg-white border-t border-[#E8E0D9] space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#80736F]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#302725]">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#80736F]">
                  <span>Delivery Fee (Lahore)</span>
                  <span className="font-semibold text-[#302725]">
                    {deliveryFee === 0 ? <span className="text-green-600 font-bold">FREE</span> : `Rs. ${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#302725] pt-2 border-t border-[#E8E0D9]">
                  <span>Total Amount</span>
                  <span className="text-base text-[#762F3D]">Rs. {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full bg-[#762F3D] hover:bg-[#5F2030] text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={clearCart}
                  className="w-full bg-transparent hover:bg-gray-100 text-[#80736F] py-2 rounded-xl text-xs font-medium transition"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <CheckoutModal onClose={() => setCheckoutModalOpen(false)} />
      )}
    </>
  );
};

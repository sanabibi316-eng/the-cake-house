import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle2, ShieldCheck, MapPin, Phone, User, CreditCard, Loader2 } from 'lucide-react';

interface CheckoutModalProps {
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose }) => {
  const { currentUser, cart, createOrder, settings, setCurrentView, setAuthModalOpen, setAuthModalTab, setAuthModalMessage, switchRole } = useApp();

  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [fulfillment, setFulfillment] = useState<'Delivery' | 'Pickup'>('Delivery');
  const [address, setAddress] = useState(currentUser.addresses[0] || 'Gulberg III, Lahore');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'COD'>('COD');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeThreshold = settings.freeDeliveryThreshold ?? 3500;
  const standardFee = settings.deliveryFee ?? 250;
  const deliveryFee = fulfillment === 'Delivery' && subtotal < freeThreshold ? standardFee : 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name || !phone) {
      alert('Please fill in your name and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newOrder = await createOrder({
        customerId: currentUser.id,
        customerName: name,
        customerPhone: phone,
        customerEmail: currentUser.email,
        items: cart.map(i => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          variant: i.variant,
          image: i.image
        })),
        subtotal,
        discount: 0,
        deliveryFee,
        total,
        amountPaid: paymentMethod === 'Bank Transfer' ? total : 0,
        paymentMethod,
        paymentStatus: paymentMethod === 'Bank Transfer' ? 'Paid' : 'Pending',
        fulfillmentMethod: fulfillment,
        deliveryAddress: fulfillment === 'Delivery' ? address : undefined,
        status: 'Confirmed'
      });

      setPlacedOrderNumber(newOrder.orderNumber);
      setOrderPlaced(true);
    } catch (err: any) {
      alert(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E8E0D9] animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col overflow-hidden">
        
        {currentUser.role === 'guest' ? (
          <div className="p-8 text-center space-y-5">
            <div className="flex justify-end -mt-4 -mr-4">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#80736F] hover:text-[#302725] rounded-full hover:bg-[#FAF7F2] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-16 h-16 bg-[#762F3D]/10 text-[#762F3D] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-2xl text-[#302725]">Customer Sign-In Required</h3>
              <p className="text-xs text-[#80736F] max-w-sm mx-auto leading-relaxed">
                Guest browsing is supported, but you must be signed in with an active customer account to place, pay, and track orders.
              </p>
            </div>

            <div className="bg-[#FAF7F2] p-4 rounded-xl text-left text-xs space-y-2 border border-[#E8E0D9]">
              <div className="flex justify-between text-[#80736F]">
                <span>Items in Cart:</span>
                <span className="font-semibold text-[#302725]">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
              </div>
              <div className="flex justify-between text-[#80736F]">
                <span>Total Payable:</span>
                <span className="font-bold text-[#762F3D]">Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setAuthModalTab('login');
                    setAuthModalMessage('Please sign in as a customer to place your order.');
                    setAuthModalOpen(true);
                  }}
                  className="flex-1 bg-[#762F3D] hover:bg-[#5F2030] text-white py-3 rounded-xl font-semibold text-xs transition shadow cursor-pointer"
                >
                  Sign In to Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setAuthModalTab('register');
                    setAuthModalMessage('Create your Cake House account to place your order.');
                    setAuthModalOpen(true);
                  }}
                  className="flex-1 bg-white hover:bg-[#FAF7F2] text-[#762F3D] border border-[#762F3D] py-3 rounded-xl font-semibold text-xs transition cursor-pointer"
                >
                  Create New Account
                </button>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await switchRole('customer');
                }}
                className="w-full text-xs text-[#80736F] hover:text-[#762F3D] underline py-1 transition cursor-pointer"
              >
                Or continue with Demo Customer account (Ayesha Khan)
              </button>
            </div>
          </div>
        ) : orderPlaced ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-serif font-bold text-2xl text-[#302725]">Order Confirmed!</h3>
            <p className="text-sm text-[#80736F]">
              Thank you for your order. Your order number is <strong className="text-[#762F3D]">{placedOrderNumber}</strong>. We are preparing your fresh artisan bakes!
            </p>
            <div className="bg-[#FAF7F2] p-4 rounded-xl text-left text-xs space-y-2 border border-[#E8E0D9]">
              <div className="flex justify-between"><span className="text-[#80736F]">Fulfillment:</span><span className="font-semibold">{fulfillment}</span></div>
              <div className="flex justify-between"><span className="text-[#80736F]">Total Payable:</span><span className="font-bold text-[#762F3D]">Rs. {total.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-[#80736F]">Payment:</span><span className="font-semibold">{paymentMethod}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              {currentUser.role === 'customer' && (
                <button
                  onClick={() => {
                    onClose();
                    setCurrentView('customer-portal');
                  }}
                  className="flex-1 bg-[#762F3D] hover:bg-[#5F2030] text-white py-3 rounded-xl font-semibold text-xs transition shadow cursor-pointer"
                >
                  Track in Customer Portal
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 bg-[#FAF7F2] hover:bg-[#F3E6DF] text-[#762F3D] border border-[#762F3D]/20 py-3 rounded-xl font-semibold text-xs transition shadow-2xs cursor-pointer"
              >
                Back to Storefront
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-5 overflow-y-auto flex-1">
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-4">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#302725]">Checkout</h3>
                <p className="text-xs text-[#80736F]">Secure checkout for {settings.bakeryName || 'The Cake House'} Pakistan</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#80736F] hover:text-[#302725] rounded-full hover:bg-[#FAF7F2] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#80736F] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-lg pl-9 pr-3 py-2 text-[#302725] font-medium focus:outline-none focus:border-[#762F3D]"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#80736F] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-lg pl-9 pr-3 py-2 text-[#302725] font-medium focus:outline-none focus:border-[#762F3D]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Fulfillment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillment('Delivery')}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition ${fulfillment === 'Delivery' ? 'bg-[#762F3D] text-white border-[#762F3D]' : 'bg-white text-[#302725] border-[#E8E0D9]'}`}
                  >
                    Home Delivery (Lahore)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillment('Pickup')}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition ${fulfillment === 'Pickup' ? 'bg-[#762F3D] text-white border-[#762F3D]' : 'bg-white text-[#302725] border-[#E8E0D9]'}`}
                  >
                    Store Pickup (Gulberg)
                  </button>
                </div>
              </div>

              {fulfillment === 'Delivery' && (
                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Delivery Address</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#80736F] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-lg pl-9 pr-3 py-2 text-[#302725] font-medium focus:outline-none focus:border-[#762F3D]"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['COD', 'Bank Transfer', 'Cash'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-lg border text-[11px] font-semibold transition ${paymentMethod === m ? 'bg-[#C5A46D] text-[#302725] border-[#C5A46D]' : 'bg-white text-[#302725] border-[#E8E0D9]'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E0D9] space-y-1.5">
                <div className="flex justify-between"><span className="text-[#80736F]">Subtotal</span><span className="font-semibold">Rs. {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#80736F]">Delivery Fee</span><span className="font-semibold">{deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee}`}</span></div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#E8E0D9] text-[#762F3D]">
                  <span>Total Amount</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#302725] py-3 rounded-xl font-semibold text-xs transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#762F3D] hover:bg-[#5F2030] text-white py-3 rounded-xl font-semibold text-xs transition shadow-md flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <span>Confirm Order (Rs. {total.toLocaleString()})</span>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { setCurrentView, settings } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <span className="bg-[#762F3D]/10 text-[#762F3D] px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          Our Heritage
        </span>
        <h1 className="font-serif text-4xl font-bold text-[#302725]">About {settings.bakeryName || 'The Cake House'}</h1>
        <p className="text-xs sm:text-sm text-[#80736F] max-w-xl mx-auto">
          Crafting moments of pure joy and celebration across {settings.city || 'Lahore, Pakistan'} with passion, artisanal expertise, and the finest ingredients.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E0D9] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <h3 className="font-serif text-2xl font-bold text-[#302725]">Baked Fresh Every Single Day</h3>
          <p className="text-xs sm:text-sm text-[#80736F] leading-relaxed">
            Founded in {settings.address || 'Gulberg III'}, {settings.city || 'Lahore'}, {settings.bakeryName || 'The Cake House'} has grown into Pakistan’s most beloved artisan bakery. We believe that every celebration — big or small — deserves a cake made without compromise.
          </p>
          <p className="text-xs sm:text-sm text-[#80736F] leading-relaxed">
            From our signature Belgian chocolate fudge cakes to custom wedding masterpieces, every creation reflects our uncompromising dedication to taste, texture, and visual elegance.
          </p>
          <button
            onClick={() => setCurrentView('products')}
            className="bg-[#762F3D] text-white px-6 py-3 rounded-xl text-xs font-semibold shadow hover:bg-[#5F2030] transition"
          >
            Explore Our Menu
          </button>
        </div>
        <div>
          <img
            src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80"
            alt="Baking"
            className="rounded-2xl shadow-xl object-cover w-full h-80"
          />
        </div>
      </div>
    </div>
  );
};

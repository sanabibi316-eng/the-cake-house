import React from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentView, settings } = useApp();

  return (
    <footer className="bg-[#302725] text-[#FAF7F2] pt-12 sm:pt-16 pb-12 border-t-4 border-[#C5A46D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#762F3D] flex items-center justify-center text-[#C5A46D] font-serif font-bold text-xl border border-[#C5A46D]">
              {settings.bakeryName ? settings.bakeryName.trim().charAt(0).toUpperCase() : 'C'}
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-white">
              {settings.bakeryName || 'The Cake House'}
            </span>
          </div>
          <p className="text-xs text-[#E8E0D9]/80 leading-relaxed">
            {settings.tagline || 'Artisanal Bakery & Luxury Cakes'} — Pakistan’s premier artisan bakery specializing in luxury custom cakes, artisanal pastries, and handcrafted daily bakes made with pure love and premium ingredients.
          </p>
          <div className="flex items-center gap-3 pt-2 text-[#C5A46D]">
            <a href="#facebook" className="p-2 bg-[#762F3D]/40 rounded-full hover:bg-[#762F3D] transition"><Facebook className="w-4 h-4" /></a>
            <a href="#instagram" className="p-2 bg-[#762F3D]/40 rounded-full hover:bg-[#762F3D] transition"><Instagram className="w-4 h-4" /></a>
            <a href="#twitter" className="p-2 bg-[#762F3D]/40 rounded-full hover:bg-[#762F3D] transition"><Twitter className="w-4 h-4" /></a>
            <a href="#youtube" className="p-2 bg-[#762F3D]/40 rounded-full hover:bg-[#762F3D] transition"><Youtube className="w-4 h-4" /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-serif text-base font-semibold text-[#C5A46D] mb-4 uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2.5 text-xs text-[#E8E0D9]/90">
            <li><button onClick={() => setCurrentView('home')} className="hover:text-[#C5A46D] transition">Home</button></li>
            <li><button onClick={() => setCurrentView('products')} className="hover:text-[#C5A46D] transition">Products Catalog</button></li>
            <li><button onClick={() => setCurrentView('custom-cake')} className="hover:text-[#C5A46D] transition">Custom Cake Request</button></li>
            <li><button onClick={() => setCurrentView('about')} className="hover:text-[#C5A46D] transition">About Us</button></li>
            <li><button onClick={() => setCurrentView('contact')} className="hover:text-[#C5A46D] transition">Contact & Locations</button></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-serif text-base font-semibold text-[#C5A46D] mb-4 uppercase tracking-wider">Contact Us</h4>
          <ul className="space-y-3 text-xs text-[#E8E0D9]/90">
            <li className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-[#C5A46D] shrink-0 mt-0.5" />
              <a href={`tel:${(settings.phone || '+923001234567').replace(/\s+/g, '')}`} className="hover:text-[#C5A46D] transition">
                {settings.phone || '+92 300 1234567'}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-[#C5A46D] shrink-0 mt-0.5" />
              <a href={`mailto:${settings.email || 'info@thecakehouse.pk'}`} className="hover:text-[#C5A46D] transition">
                {settings.email || 'info@thecakehouse.pk'}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#C5A46D] shrink-0 mt-0.5" />
              <span>{settings.address}, {settings.city}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#C5A46D] shrink-0 mt-0.5" />
              <span>{settings.businessHours || 'Mon – Sun: 10:00 AM – 10:00 PM'}</span>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-serif text-base font-semibold text-[#C5A46D] mb-4 uppercase tracking-wider">Subscribe for Updates</h4>
          <p className="text-xs text-[#E8E0D9]/80 mb-3">Get seasonal menus, festive offers, and baking tips directly in your inbox.</p>
          <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }} className="space-y-2">
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full bg-[#3D322F] border border-[#C5A46D]/40 rounded px-3 py-2 text-xs text-white placeholder-[#80736F] focus:outline-none focus:border-[#C5A46D]"
              required
            />
            <button
              type="submit"
              className="w-full bg-[#762F3D] hover:bg-[#5F2030] text-white py-2 rounded text-xs font-semibold transition border border-[#C5A46D]/50 shadow"
            >
              Subscribe Now
            </button>
          </form>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-[#4A3D3A] text-center text-xs text-[#80736F] flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>© {new Date().getFullYear()} {settings.bakeryName || 'The Cake House'}. All rights reserved.</div>
        <div className="flex gap-6">
          <a href="#privacy" className="hover:text-[#C5A46D] transition">Privacy Policy</a>
          <a href="#terms" className="hover:text-[#C5A46D] transition">Terms & Conditions</a>
        </div>
      </div>
    </footer>
  );
};

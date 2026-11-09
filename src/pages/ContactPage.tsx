import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ContactPage: React.FC = () => {
  const { settings, showToast } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!message.trim() || message.trim().length < 5) {
      setError('Please enter a message of at least 5 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send your message. Please try again.');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
      if (showToast) {
        showToast('Message sent successfully! We will contact you shortly.', 'success');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again or reach out by phone.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8 text-[#302725]">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* 1. Page Heading */}
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#302725] tracking-tight">
            Get In Touch
          </h1>
          <p className="text-xs sm:text-sm text-[#80736F] leading-relaxed">
            We'd love to hear from you. Send us a message or visit our bakery.
          </p>
        </div>

        {/* 2. Main Contact Section: Two Columns (Info & Form) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN — Contact Information */}
          <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
            
            {/* Our Location */}
            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-full bg-[#F5EBE6] border border-[#E8D6C6] flex items-center justify-center shrink-0 text-[#762F3D] group-hover:scale-105 transition duration-200">
                <MapPin className="w-5 h-5 text-[#762F3D]" />
              </div>
              <div className="space-y-0.5 pt-0.5">
                <h3 className="font-bold text-xs sm:text-sm text-[#302725]">
                  Our Location
                </h3>
                <p className="text-xs text-[#80736F] leading-snug">
                  {settings.address}, {settings.city}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-full bg-[#F5EBE6] border border-[#E8D6C6] flex items-center justify-center shrink-0 text-[#762F3D] group-hover:scale-105 transition duration-200">
                <Phone className="w-4 h-4 text-[#762F3D]" />
              </div>
              <div className="space-y-0.5 pt-0.5">
                <h3 className="font-bold text-xs sm:text-sm text-[#302725]">
                  Phone
                </h3>
                <a
                  href={`tel:${(settings.phone || '+923001234567').replace(/\s+/g, '')}`}
                  className="inline-block text-xs text-[#80736F] hover:text-[#762F3D] transition font-medium"
                >
                  {settings.phone || '+92 300 1234567'}
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-full bg-[#F5EBE6] border border-[#E8D6C6] flex items-center justify-center shrink-0 text-[#762F3D] group-hover:scale-105 transition duration-200">
                <Mail className="w-4 h-4 text-[#762F3D]" />
              </div>
              <div className="space-y-0.5 pt-0.5">
                <h3 className="font-bold text-xs sm:text-sm text-[#302725]">
                  Email
                </h3>
                <a
                  href={`mailto:${settings.email || 'info@thecakehouse.pk'}`}
                  className="inline-block text-xs text-[#80736F] hover:text-[#762F3D] transition font-medium"
                >
                  {settings.email || 'info@thecakehouse.pk'}
                </a>
              </div>
            </div>

            {/* Business Hours */}
            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-full bg-[#F5EBE6] border border-[#E8D6C6] flex items-center justify-center shrink-0 text-[#762F3D] group-hover:scale-105 transition duration-200">
                <Clock className="w-4 h-4 text-[#762F3D]" />
              </div>
              <div className="space-y-0.5 pt-0.5">
                <h3 className="font-bold text-xs sm:text-sm text-[#302725]">
                  Business Hours
                </h3>
                <p className="text-xs text-[#80736F] leading-snug">
                  {settings.businessHours || 'Mon – Sun: 10:00 AM – 10:00 PM'}
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN — Contact Form */}
          <div className="animate-in fade-in duration-300">
            
            {success ? (
              <div className="bg-white rounded-2xl border border-[#E8E0D9] p-7 text-center space-y-3.5 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#302725]">
                  Message Received!
                </h3>
                <p className="text-xs text-[#80736F] max-w-xs mx-auto leading-relaxed">
                  Thank you for contacting {settings.bakeryName || 'The Cake House'}. Our team will review your message and respond shortly.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSuccess(false)}
                    className="text-xs font-bold text-[#762F3D] hover:underline cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Inline Error Message */}
                {error && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span className="flex-1 font-medium">{error}</span>
                  </div>
                )}

                {/* Your Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#302725] mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="w-full bg-white border border-[#E8E0D9] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#302725] placeholder:text-[#A09590] focus:outline-none focus:border-[#762F3D] focus:ring-1 focus:ring-[#762F3D]/20 transition shadow-2xs"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-[#302725] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full bg-white border border-[#E8E0D9] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#302725] placeholder:text-[#A09590] focus:outline-none focus:border-[#762F3D] focus:ring-1 focus:ring-[#762F3D]/20 transition shadow-2xs"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-[#302725] mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Your message"
                    required
                    className="w-full bg-white border border-[#E8E0D9] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#302725] placeholder:text-[#A09590] focus:outline-none focus:border-[#762F3D] focus:ring-1 focus:ring-[#762F3D]/20 transition shadow-2xs resize-none"
                  />
                </div>

                {/* Send Message Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#762F3D] hover:bg-[#5F2030] disabled:bg-[#A09590] disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Message</span>
                  )}
                </button>

              </form>
            )}

          </div>

        </div>

        {/* 3. Location Map: Large, beautiful, responsive map */}
        <div className="space-y-3 pt-2">
          <div className="relative w-full rounded-2xl sm:rounded-3xl border border-[#E8E0D9] overflow-hidden shadow-sm bg-[#F5EBE6]/40 h-64 sm:h-72 md:h-80 group">
            
            {/* Interactive Embedded Google Map centered on Gulberg III, Lahore */}
            <iframe
              title={`${settings.bakeryName || 'The Cake House'} Bakery Location`}
              src="https://maps.google.com/maps?q=Main+Boulevard,+Gulberg+III,+Lahore,+Pakistan&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0 filter grayscale-[15%] contrast-[105%]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Custom Marker Tooltip matching reference image pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center">
              <div className="bg-white/95 backdrop-blur-xs text-[#302725] px-3.5 py-1.5 rounded-xl shadow-md border border-[#E8E0D9] text-xs font-serif font-bold flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-[#762F3D] animate-ping" />
                <span>{settings.bakeryName || 'The Cake House'}</span>
              </div>
              <div className="w-0 h-0 border-x-6 border-x-transparent border-t-8 border-t-white -mt-0.5 drop-shadow-xs" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#762F3D] border-2 border-white shadow-md -mt-1" />
            </div>

            {/* Map Action Button (Bottom Right) */}
            <div className="absolute bottom-3 right-3 z-10">
              <a
                href="https://maps.google.com/?q=Main+Boulevard,+Gulberg+III,+Lahore,+Pakistan"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-white/95 hover:bg-white text-[#762F3D] text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm border border-[#E8E0D9] transition"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

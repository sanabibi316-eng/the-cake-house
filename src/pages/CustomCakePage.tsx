import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Dropdown } from '../components/Dropdown';
import { 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Image as ImageIcon, 
  X, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Link2,
  FileText
} from 'lucide-react';

export const CustomCakePage: React.FC = () => {
  const { currentUser, createCustomCake, setCurrentView, requireAuth, settings } = useApp();

  const [step, setStep] = useState(1);
  const [occasion, setOccasion] = useState('Birthday');
  const [cakeType, setCakeType] = useState('Round Cake');
  const [flavor, setFlavor] = useState('Chocolate');
  const [sizeWeight, setSizeWeight] = useState('8 inch (1.5 kg)');
  const [tiers, setTiers] = useState('Single Tier');
  const [filling, setFilling] = useState('Chocolate Mousse');
  const [froasting, setFroasting] = useState('Fresh Cream');
  const [preferredColors, setPreferredColors] = useState(['#762F3D', '#C5A46D']);
  const [designDescription, setDesignDescription] = useState('A simple elegant cake with floral design.');
  const [personalMessage, setPersonalMessage] = useState('Happy Birthday!');
  const [referenceImage, setReferenceImage] = useState('/assets/custom_wedding_cake.jpg');
  
  // Real Image Upload States
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [selectedFileName, setSelectedFileName] = useState<string>('sample-celebration-cake.jpg');
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileValidationAndUpload = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);

    // Validate MIME types and file extensions
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();

    const isMimeValid = validMimes.includes(file.type);
    const isExtValid = validExtensions.includes(ext);

    if (!isMimeValid && !isExtValid) {
      setUploadError('Invalid file type. Please select a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    // Validate size (max 5 MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadError(`File is too large (${sizeMB} MB). Maximum allowed size is 5 MB.`);
      return;
    }

    setSelectedFileName(file.name);
    setSelectedFileSize(file.size);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Server rejected file upload. Please try again.');
      }

      setReferenceImage(result.url);
      setUploadSuccess(true);
      setUploadMode('upload');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image. Please check your network and try again.');
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileValidationAndUpload(file);
    }
  };

  const handleRemoveImage = () => {
    setReferenceImage('');
    setSelectedFileName('');
    setSelectedFileSize(null);
    setUploadSuccess(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileValidationAndUpload(file);
    }
  };
  
  const [requiredDate, setRequiredDate] = useState('2026-11-10');
  const [pickupOrDelivery, setPickupOrDelivery] = useState<'Pickup' | 'Delivery'>('Delivery');
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser.addresses[0] || 'Gulberg III, Lahore');
  const [customerName, setCustomerName] = useState(currentUser.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser.phone || '');
  const [submitted, setSubmitted] = useState(false);
  const [reqNumber, setReqNumber] = useState('');

  const estimatedPrice = 4500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth(`Create an account or sign in to submit a custom cake order with ${settings.bakeryName || 'The Cake House'}.`, false)) {
      return;
    }
    createCustomCake({
      customerId: currentUser.id,
      customerName: customerName || currentUser.name,
      customerPhone: customerPhone || currentUser.phone,
      occasion,
      cakeType,
      flavor,
      sizeWeight,
      tiers,
      filling,
      froasting,
      preferredColors,
      designDescription,
      personalMessage,
      referenceImage,
      requiredDate,
      pickupOrDelivery,
      deliveryAddress: pickupOrDelivery === 'Delivery' ? deliveryAddress : undefined,
      estimatedPrice
    });
    setReqNumber(`#CC-${Math.floor(500 + Math.random() * 500)}`);
    setSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="bg-[#762F3D]/10 text-[#762F3D] px-3.5 py-1 rounded-full text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 inline mr-1 text-[#C5A46D]" />
          Bespoke Custom Cakes
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#302725]">
          Design Your Dream Cake
        </h1>
        <p className="text-xs sm:text-sm text-[#80736F] max-w-lg mx-auto">
          Tell us your occasion, flavor preferences, and design vision. Our master pastry chefs will craft a masterpiece for your celebration.
        </p>
      </div>

      {submitted ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E8E0D9] text-center max-w-xl mx-auto space-y-6 shadow-xl">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="font-serif font-bold text-2xl text-[#302725]">Custom Request Submitted!</h3>
          <p className="text-sm text-[#80736F]">
            Your custom cake request <strong className="text-[#762F3D]">{reqNumber}</strong> has been received and is pending review by our master baker. We will contact you shortly with a confirmed quotation.
          </p>
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setCurrentView('customer-portal')}
              className="flex-1 bg-[#762F3D] text-white py-3 rounded-xl font-semibold text-xs shadow hover:bg-[#5F2030] transition"
            >
              View in Customer Portal
            </button>
            <button
              onClick={() => { setSubmitted(false); setStep(1); }}
              className="flex-1 bg-gray-100 text-[#302725] py-3 rounded-xl font-semibold text-xs hover:bg-gray-200 transition"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Form Wizard */}
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-[#E8E0D9] shadow-sm space-y-6 sm:space-y-8">
            
            {/* Step Indicator */}
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-6">
              {[
                { num: 1, label: 'Occasion' },
                { num: 2, label: 'Specifications' },
                { num: 3, label: 'Reference & Schedule' }
              ].map(s => (
                <div key={s.num} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === s.num ? 'bg-[#762F3D] text-white' : step > s.num ? 'bg-green-600 text-white' : 'bg-[#FAF7F2] text-[#80736F] border border-[#E8E0D9]'}`}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className={`text-xs font-bold hidden sm:inline ${step === s.num ? 'text-[#302725]' : 'text-[#80736F]'}`}>{s.label}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="font-serif font-bold text-lg text-[#302725]">Step 1: Select Occasion</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['Birthday', 'Wedding', 'Engagement', 'Anniversary', 'Graduation', 'Baby Shower', 'Corporate', 'Other'].map(occ => (
                      <button
                        key={occ}
                        type="button"
                        onClick={() => setOccasion(occ)}
                        className={`py-3 px-4 rounded-xl border text-xs font-semibold transition ${occasion === occ ? 'bg-[#762F3D] text-white border-[#762F3D] shadow-md' : 'bg-[#FAF7F2] text-[#302725] border-[#E8E0D9] hover:bg-white'}`}
                      >
                        {occ}
                      </button>
                    ))}
                  </div>

                  <div className="pt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="bg-[#762F3D] text-white px-6 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow hover:bg-[#5F2030] transition"
                    >
                      <span>Next: Cake Specs</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200 text-xs">
                  <h3 className="font-serif font-bold text-lg text-[#302725]">Step 2: Cake Specifications</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[#302725] mb-1.5">Cake Type</label>
                      <Dropdown
                        value={cakeType}
                        onChange={setCakeType}
                        options={[
                          'Round Cake',
                          'Square Cake',
                          'Heart Shape',
                          'Tiered Wedding Cake',
                          'Sculpted / 3D Cake',
                        ]}
                        size="md"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#302725] mb-1.5">Flavor</label>
                      <Dropdown
                        value={flavor}
                        onChange={setFlavor}
                        options={[
                          'Chocolate',
                          'Red Velvet',
                          'Vanilla Bean',
                          'Lotus Biscoff',
                          'Ferrero Rocher',
                          'Fresh Mango / Fruit',
                        ]}
                        size="md"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#302725] mb-1.5">Size / Weight</label>
                      <Dropdown
                        value={sizeWeight}
                        onChange={setSizeWeight}
                        options={[
                          '6 inch (1.0 kg)',
                          '8 inch (1.5 kg)',
                          '10 inch (2.5 kg)',
                          '12 inch + (3.5+ kg)',
                        ]}
                        size="md"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#302725] mb-1.5">Frosting</label>
                      <Dropdown
                        value={froasting}
                        onChange={setFroasting}
                        options={[
                          'Fresh Cream',
                          'Buttercream',
                          'Cream Cheese',
                          'Chocolate Ganache',
                          'Fondant',
                        ]}
                        size="md"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#302725] mb-1">Design & Theme Description</label>
                    <textarea
                      rows={3}
                      value={designDescription}
                      onChange={e => setDesignDescription(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-3 font-medium text-[#302725]"
                      placeholder="Describe colors, theme, decorations..."
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#302725] mb-1">Personalized Cake Message</label>
                    <input
                      type="text"
                      value={personalMessage}
                      onChange={e => setPersonalMessage(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-2.5 font-medium text-[#302725]"
                      placeholder="e.g. Happy 30th Birthday Ali!"
                    />
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="bg-gray-100 text-[#302725] px-6 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-gray-200 transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="bg-[#762F3D] text-white px-6 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow hover:bg-[#5F2030] transition"
                    >
                      <span>Next: Schedule & Submit</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200 text-xs">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#302725]">Step 3: Reference & Schedule</h3>
                    <p className="text-[#80736F] text-xs mt-0.5">Upload a design inspiration photo or provide a reference image link.</p>
                  </div>

                  {/* Hidden file input for real device uploads */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {/* Reference Image Upload Box */}
                  <div className="space-y-3 bg-[#FAF7F2]/70 p-4 rounded-2xl border border-[#E8E0D9]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="font-semibold text-[#302725] flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#762F3D]" />
                        <span>Cake Reference Image</span>
                      </label>

                      {/* Mode Switcher */}
                      <div className="flex bg-[#EFE9E2] p-0.5 rounded-lg text-[11px] self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setUploadMode('upload')}
                          className={`px-3 py-1 rounded-md font-semibold transition ${
                            uploadMode === 'upload' 
                              ? 'bg-white text-[#762F3D] shadow-xs' 
                              : 'text-[#80736F] hover:text-[#302725]'
                          }`}
                        >
                          <Upload className="w-3 h-3 inline mr-1" />
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMode('url')}
                          className={`px-3 py-1 rounded-md font-semibold transition ${
                            uploadMode === 'url' 
                              ? 'bg-white text-[#762F3D] shadow-xs' 
                              : 'text-[#80736F] hover:text-[#302725]'
                          }`}
                        >
                          <Link2 className="w-3 h-3 inline mr-1" />
                          Image URL
                        </button>
                      </div>
                    </div>

                    {/* Mode: File Upload */}
                    {uploadMode === 'upload' && (
                      <div className="space-y-3">
                        {/* Drag and Drop Zone when no uploaded file */}
                        {!referenceImage ? (
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={handleOpenPicker}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
                              isDragging 
                                ? 'border-[#762F3D] bg-[#762F3D]/5 scale-[0.99]' 
                                : 'border-[#D9CFC4] hover:border-[#762F3D] bg-white hover:bg-[#FAF7F2]'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8E0D9] flex items-center justify-center text-[#762F3D] shadow-xs">
                              <Upload className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#302725]">
                                Drag & drop reference image here, or <span className="text-[#762F3D] underline underline-offset-2">browse computer</span>
                              </p>
                              <p className="text-[11px] text-[#80736F] mt-0.5">
                                Supports JPG, JPEG, PNG, WEBP (Max 5 MB)
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleOpenPicker(); }}
                              className="mt-1 bg-[#762F3D] hover:bg-[#5F2030] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Select Image File</span>
                            </button>
                          </div>
                        ) : (
                          /* Uploaded preview card */
                          <div className="bg-white rounded-2xl p-3.5 border border-[#E8E0D9] shadow-xs space-y-3">
                            <div className="flex items-center gap-3.5">
                              {/* Thumbnail */}
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E8E0D9] shrink-0 bg-[#FAF7F2]">
                                <img
                                  src={referenceImage}
                                  alt="Reference preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/assets/custom_wedding_cake.jpg';
                                  }}
                                />
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#302725] truncate text-xs" title={selectedFileName || 'Reference Image'}>
                                  {selectedFileName || 'Reference Image'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {selectedFileSize && (
                                    <span className="text-[11px] text-[#80736F]">
                                      {formatFileSize(selectedFileSize)}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Ready
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={handleOpenPicker}
                                  disabled={isUploading}
                                  title="Change Image"
                                  className="px-3 py-2 bg-[#FAF7F2] hover:bg-[#EFE9E2] text-[#302725] rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-[#E8E0D9] transition"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-[#762F3D]" />
                                  <span className="hidden sm:inline">Change</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  disabled={isUploading}
                                  title="Remove Image"
                                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Uploading progress indicator */}
                        {isUploading && (
                          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                            <Loader2 className="w-4 h-4 text-amber-700 animate-spin shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[#302725] text-xs">Uploading reference image to server...</p>
                              <p className="text-[11px] text-[#80736F]">Validating and saving file to /uploads</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mode: URL input */}
                    {uploadMode === 'url' && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={referenceImage}
                            onChange={e => {
                              setReferenceImage(e.target.value);
                              setSelectedFileName('Linked Image');
                              setSelectedFileSize(null);
                            }}
                            className="flex-1 bg-white border border-[#E8E0D9] rounded-xl p-2.5 font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                            placeholder="https://images.unsplash.com/photo-..."
                          />
                          {referenceImage && (
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
                              title="Clear URL"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-[#80736F]">Paste a direct link to a cake design photograph (JPEG, PNG, or WEBP).</p>
                      </div>
                    )}

                    {/* Inline Error Message */}
                    {uploadError && (
                      <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                        <div className="flex-1">
                          <span className="font-semibold block">Upload Failed</span>
                          <span>{uploadError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadError(null)}
                          className="text-red-400 hover:text-red-700 p-0.5"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Inline Success Message */}
                    {uploadSuccess && (
                      <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold">Reference photo uploaded and attached successfully!</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[#302725] mb-1">Required Date</label>
                      <input
                        type="date"
                        value={requiredDate}
                        onChange={e => setRequiredDate(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-2.5 font-medium text-[#302725]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#302725] mb-1.5">Fulfillment</label>
                      <Dropdown
                        value={pickupOrDelivery}
                        onChange={val => setPickupOrDelivery(val as any)}
                        options={[
                          { value: 'Delivery', label: 'Home Delivery (Lahore)' },
                          { value: 'Pickup', label: 'Store Pickup (Gulberg)' },
                        ]}
                        size="md"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {pickupOrDelivery === 'Delivery' && (
                    <div>
                      <label className="block font-semibold text-[#302725] mb-1">Delivery Address</label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-2.5 font-medium text-[#302725]"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[#302725] mb-1">Your Name</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-2.5 font-medium text-[#302725]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#302725] mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-2.5 font-medium text-[#302725]"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="bg-gray-100 text-[#302725] px-6 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="bg-[#762F3D] hover:bg-[#5F2030] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-xs font-bold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>{isUploading ? 'Uploading Image...' : 'Submit Custom Cake Request'}</span>
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* Right: Live Order Summary Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E0D9] shadow-sm space-y-6 h-fit sticky top-28">
            <h3 className="font-serif font-bold text-lg text-[#302725] border-b border-[#E8E0D9] pb-3">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between"><span className="text-[#80736F]">Occasion:</span><span className="font-semibold">{occasion}</span></div>
              <div className="flex justify-between"><span className="text-[#80736F]">Cake Type:</span><span className="font-semibold">{cakeType}</span></div>
              <div className="flex justify-between"><span className="text-[#80736F]">Flavor:</span><span className="font-semibold">{flavor}</span></div>
              <div className="flex justify-between"><span className="text-[#80736F]">Size / Weight:</span><span className="font-semibold">{sizeWeight}</span></div>
              <div className="flex justify-between"><span className="text-[#80736F]">Filling:</span><span className="font-semibold">{filling}</span></div>
              <div className="flex justify-between"><span className="text-[#80736F]">Frosting:</span><span className="font-semibold">{froasting}</span></div>
            </div>

            {referenceImage && (
              <div className="space-y-1.5 pt-2 border-t border-[#E8E0D9]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#80736F] font-semibold flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-[#762F3D]" />
                    Design Reference
                  </span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Attached
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-[#E8E0D9] h-44 bg-[#FAF7F2] relative group shadow-inner">
                  <img
                    src={referenceImage}
                    alt="Cake Reference"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/custom_wedding_cake.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                    <span className="text-xs text-white font-medium truncate">
                      {selectedFileName || 'Reference Design'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] flex justify-between items-center">
              <span className="text-xs font-bold text-[#302725]">Estimated Price:</span>
              <span className="font-serif text-lg font-bold text-[#762F3D]">Rs. {estimatedPrice.toLocaleString()}</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

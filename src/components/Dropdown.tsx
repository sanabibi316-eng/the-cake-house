import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: (DropdownOption | string)[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  prefix?: React.ReactNode;
  usePortal?: boolean;
}

interface MenuPosition {
  top: number;
  bottom: number;
  left: number;
  width: number;
  placement: 'bottom' | 'top';
  maxHeight: number;
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'left',
  size = 'md',
  disabled = false,
  prefix,
  usePortal = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Normalize options to uniform DropdownOption shape
  const normalizedOptions: DropdownOption[] = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  // Pure position calculation returning precise coordinates anchored directly to trigger button
  const calculatePosition = useCallback((): MenuPosition | null => {
    if (!buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const estimatedItemHeight = 42;
    const estimatedMenuHeight = Math.min(normalizedOptions.length * estimatedItemHeight + 16, 260);

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine whether to open downward or upward
    const shouldOpenUpward = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
    const placement: 'bottom' | 'top' = shouldOpenUpward ? 'top' : 'bottom';

    const maxHeight = placement === 'bottom'
      ? Math.min(Math.max(spaceBelow - 16, 120), 260)
      : Math.min(Math.max(spaceAbove - 16, 120), 260);

    // Menu width must match trigger button or minimum 180px, clamped to viewport width
    const width = Math.min(Math.max(rect.width, 180), Math.max(160, viewportWidth - 16));

    // Horizontal alignment and viewport clamping (ensuring zero horizontal displacement)
    let left = align === 'right' ? rect.right - width : rect.left;
    if (left + width > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - width - 8);
    }
    if (left < 8) {
      left = 8;
    }

    const top = rect.bottom + 6;
    const bottom = viewportHeight - rect.top + 6;

    return {
      top,
      bottom,
      left,
      width,
      placement,
      maxHeight
    };
  }, [align, normalizedOptions.length]);

  // Initial state calculated synchronously if ref is already available, or zero-fallback
  const [menuPosition, setMenuPosition] = useState<MenuPosition>(() => {
    return {
      top: 0,
      bottom: 0,
      left: 0,
      width: 0,
      placement: 'bottom',
      maxHeight: 260
    };
  });

  // Open dropdown with immediate synchronous position calculation BEFORE render/paint
  const openDropdown = useCallback(() => {
    if (disabled) return;
    const pos = calculatePosition();
    if (pos) {
      setMenuPosition(pos);
    }
    setIsOpen(true);
    setFocusedIndex(normalizedOptions.findIndex(o => o.value === value));
  }, [disabled, calculatePosition, normalizedOptions, value]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleDropdown = useCallback(() => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }, [isOpen, openDropdown, closeDropdown]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        listboxRef.current &&
        !listboxRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Recalculate synchronously before paint on open, window scroll, or resize
  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return;

    // Guarantee position matches button rect immediately before browser paint
    const pos = calculatePosition();
    if (pos) {
      setMenuPosition(pos);
    }

    const handleScrollOrResize = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        // If trigger has completely scrolled out of the viewport, close dropdown
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setIsOpen(false);
          return;
        }
      }
      const updated = calculatePosition();
      if (updated) {
        setMenuPosition(updated);
      }
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, calculatePosition]);

  // Keyboard navigation & accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev < normalizedOptions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : normalizedOptions.length - 1));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        const selected = normalizedOptions[focusedIndex];
        if (selected) {
          onChange(selected.value);
          setIsOpen(false);
          buttonRef.current?.focus();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, focusedIndex, normalizedOptions, onChange]);

  const sizeStyles = {
    sm: 'py-1 pl-3 pr-8 text-xs rounded-lg min-h-[32px]',
    md: 'py-2 pl-3.5 pr-9 text-xs sm:text-sm rounded-xl min-h-[40px]',
    lg: 'py-2.5 pl-4 pr-10 text-sm rounded-2xl min-h-[46px]'
  };

  const chevronSizes = {
    sm: 'w-3.5 h-3.5 right-2',
    md: 'w-4 h-4 right-2.5',
    lg: 'w-4 h-4 right-3'
  };

  const canUseDOM = typeof window !== 'undefined' && typeof document !== 'undefined';
  const renderInPortal = usePortal && canUseDOM;

  const animationClass = menuPosition.placement === 'top' ? 'dropdown-animate-up' : 'dropdown-animate-down';
  const transformOrigin = `${menuPosition.placement === 'top' ? 'bottom' : 'top'} ${align === 'right' ? 'right' : 'left'}`;

  const menuElement = (
    <div
      ref={listboxRef}
      role="listbox"
      tabIndex={-1}
      style={
        renderInPortal
          ? {
              position: 'fixed',
              ...(menuPosition.placement === 'top'
                ? {
                    bottom: `${menuPosition.bottom}px`,
                    top: 'auto',
                  }
                : {
                    top: `${menuPosition.top}px`,
                    bottom: 'auto',
                  }),
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
              maxHeight: `${menuPosition.maxHeight}px`,
              transformOrigin,
              zIndex: 99999,
              visibility: menuPosition.width === 0 ? 'hidden' : 'visible',
            }
          : {
              transformOrigin,
            }
      }
      className={`${
        renderInPortal
          ? ''
          : `absolute mt-1.5 w-full min-w-[140px] max-w-[calc(100vw-2rem)] sm:max-w-sm z-50 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`
      } bg-white rounded-2xl shadow-2xl border border-[#E8E0D9] py-1.5 overflow-hidden ${animationClass} ${menuClassName}`}
    >
      <div
        className="overflow-y-auto divide-y divide-[#E8E0D9]/40 scrollbar-thin"
        style={{ maxHeight: renderInPortal ? `${menuPosition.maxHeight - 12}px` : '240px' }}
      >
        {normalizedOptions.map((opt, idx) => {
          const isSelected = opt.value === value;
          const isFocused = idx === focusedIndex;

          return (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
                buttonRef.current?.focus();
              }}
              className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between gap-2.5 transition cursor-pointer select-none ${
                isSelected
                  ? 'bg-[#FAF7F2] text-[#762F3D] font-bold'
                  : isFocused
                  ? 'bg-[#F3E6DF]/50 text-[#302725]'
                  : 'text-[#302725] hover:bg-[#FAF7F2] hover:text-[#762F3D]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                <span className="truncate">{opt.label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {opt.badge && (
                  <span className="text-[10px] bg-[#FAF7F2] text-[#80736F] px-1.5 py-0.5 rounded-full border border-[#E8E0D9]">
                    {opt.badge}
                  </span>
                )}
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#762F3D] stroke-[2.5]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            if (!isOpen) {
              e.preventDefault();
              openDropdown();
            }
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full bg-[#FAF7F2] hover:bg-[#F3E6DF]/50 border border-[#E8E0D9] hover:border-[#762F3D]/40 focus:border-[#762F3D] focus:ring-2 focus:ring-[#762F3D]/15 text-[#302725] font-medium transition-all shadow-2xs relative flex items-center justify-between gap-2 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size]} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {prefix && <span className="shrink-0 text-[#80736F]">{prefix}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] bg-[#762F3D]/10 text-[#762F3D] px-2 py-0.5 rounded-full font-bold">
              {selectedOption.badge}
            </span>
          )}
        </div>

        {/* Standardized Chevron Arrow with Smooth Rotation */}
        <ChevronDown
          className={`absolute top-1/2 -translate-y-1/2 text-[#762F3D] transition-transform duration-200 pointer-events-none ${chevronSizes[size]} ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (renderInPortal ? createPortal(menuElement, document.body) : menuElement)}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SearchBar } from './SearchBar';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Icons } from '../utilities/icons';
import { categoryService } from '../services/categoryService';
import logoIcon from '../assets/brand/logo-icon.png';

export const Header: React.FC = () => {
  const { totalCount, setIsCartOpen } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [categories, setCategories] = useState(() => 
    categoryService.getCategories().filter(c => c.status === 'Visible')
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSync = () => {
      setCategories(categoryService.getCategories().filter(c => c.status === 'Visible'));
    };
    window.addEventListener('quantum_categories_updated', handleSync);
    return () => window.removeEventListener('quantum_categories_updated', handleSync);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoriesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close mobile drawer on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
        setCategoriesDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Category Icon mapper
  const getCatIcon = (iconName: string) => {
    switch (iconName) {
      case 'charger':
        return Icons.charger;
      case 'audio':
        return Icons.audio;
      case 'shield':
        return Icons.shield;
      case 'lightning':
        return Icons.lightning;
      case 'computer':
        return Icons.computer;
      default:
        return Icons.category;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur-md">
      {/* Top Announcement Bar */}
      <div className="bg-ink text-slate-200 py-1 px-3 text-[11px] sm:text-xs font-medium text-center flex items-center justify-center gap-2 border-b border-slate-800">
        <FontAwesomeIcon icon={Icons.delivery} className="text-quantum-soft h-3 w-3 flex-shrink-0" />
        <span className="truncate max-w-[340px] sm:max-w-none">
          {language === 'bn'
            ? 'সারাদেশে ক্যাশ অন ডেলিভারি • ঢাকার ভিতরে ১-২ দিনে ডেলিভারি'
            : 'Nationwide Cash on Delivery • 1-2 Days Inside Dhaka • 100% Genuine Tech'}
        </span>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-4">
          
          {/* Left: Mobile Toggle & Brand Logo */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {/* Mobile Menu Button (44px min touch target) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quantum"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              <FontAwesomeIcon
                icon={mobileMenuOpen ? Icons.close : Icons.menu}
                className="h-4.5 w-4.5"
              />
            </button>

            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group">
              <img
                src={logoIcon}
                alt="QuantumTech Logo"
                className="h-7 w-7 sm:h-8 sm:w-8 object-contain group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold tracking-tight text-ink leading-none">
                  Quantum<span className="text-quantum">Tech</span>
                </span>
                <span className="caption-5 text-muted hidden md:block mt-0.5">
                  {language === 'bn' ? 'স্মার্ট এক্সেসরিজ' : 'Modern Accessories'}
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation with Categories Dropdown */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-quantum font-semibold bg-quantum-soft'
                    : 'text-ink hover:text-quantum hover:bg-surface-alt'
                }`
              }
            >
              {t.nav.home}
            </NavLink>

            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-quantum font-semibold bg-quantum-soft'
                    : 'text-ink hover:text-quantum hover:bg-surface-alt'
                }`
              }
            >
              {t.nav.shop}
            </NavLink>

            {/* Categories Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  categoriesDropdownOpen
                    ? 'text-quantum bg-quantum-soft font-semibold'
                    : 'text-ink hover:text-quantum hover:bg-surface-alt'
                }`}
                aria-expanded={categoriesDropdownOpen}
                aria-haspopup="true"
              >
                <span>{t.catalog.categories}</span>
                <FontAwesomeIcon
                  icon={Icons.chevronDown}
                  className={`h-2.5 w-2.5 transition-transform duration-200 ${
                    categoriesDropdownOpen ? 'rotate-180 text-quantum' : 'text-muted'
                  }`}
                />
              </button>

              {/* Categories Dropdown Panel */}
              {categoriesDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-xl bg-surface border border-border shadow-float p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <span className="caption-4 uppercase font-semibold text-muted tracking-wider">
                      Product Categories
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        onClick={() => setCategoriesDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink hover:bg-quantum-soft hover:text-quantum transition-colors group"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-alt border border-border group-hover:border-quantum/30 text-muted group-hover:text-quantum transition-colors">
                          <FontAwesomeIcon icon={getCatIcon(cat.iconName)} className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-xs sm:text-sm">
                            {language === 'bn' ? cat.nameBn : cat.nameEn}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-border px-2">
                    <Link
                      to="/shop"
                      onClick={() => setCategoriesDropdownOpen(false)}
                      className="caption-3 font-semibold text-quantum hover:underline flex items-center justify-between p-1.5"
                    >
                      <span>{t.catalog.viewAll}</span>
                      <FontAwesomeIcon icon={Icons.arrowRight} className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <NavLink
              to="/track-order"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-quantum font-semibold bg-quantum-soft'
                    : 'text-ink hover:text-quantum hover:bg-surface-alt'
                }`
              }
            >
              {t.nav.trackOrder}
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-quantum font-semibold bg-quantum-soft'
                    : 'text-ink hover:text-quantum hover:bg-surface-alt'
                }`
              }
            >
              {t.nav.about}
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-quantum font-semibold bg-quantum-soft'
                    : 'text-ink hover:text-quantum hover:bg-surface-alt'
                }`
              }
            >
              {t.nav.contact}
            </NavLink>
          </nav>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xs xl:max-w-sm mx-2">
            <SearchBar />
          </div>

          {/* Right Actions: Search (Mobile), Language, Cart */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Mobile Search Button (44px min touch target) */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink hover:bg-surface-muted transition-colors"
              aria-label="Search products"
            >
              <FontAwesomeIcon icon={Icons.search} className="h-4 w-4" />
            </button>

            {/* Language Switcher (44px min touch target) */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center justify-center h-10 min-h-[44px] px-2.5 sm:px-3 rounded-lg border border-border bg-surface hover:bg-surface-muted text-xs font-semibold text-ink transition-colors active:scale-95"
              aria-label={`Switch language: ${language === 'en' ? 'Bangla' : 'English'}`}
            >
              <span className={language === 'en' ? 'text-quantum font-bold' : 'text-muted'}>
                EN
              </span>
              <span className="text-border-dark mx-0.5">/</span>
              <span className={language === 'bn' ? 'text-quantum font-bold' : 'text-muted'}>
                বাং
              </span>
            </button>

            {/* Shopping Cart Button (44px min touch target) */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center gap-1.5 h-10 min-h-[44px] px-3 sm:px-3.5 rounded-xl bg-quantum text-white hover:bg-quantum-hover active:scale-95 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quantum"
              aria-label={`Shopping cart with ${totalCount} items`}
            >
              <FontAwesomeIcon icon={Icons.cart} className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs font-semibold">
                {t.header.cart}
              </span>
              {totalCount > 0 && (
                <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-white text-quantum text-[11px] font-bold px-1 shadow-sm">
                  {totalCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Compact Mobile Search Dropdown */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1 border-t border-border animate-fadeIn">
            <SearchBar autoFocus onSearch={() => setMobileSearchOpen(false)} />
          </div>
        )}
      </div>

      {/* Mobile Drawer Navigation (Full height slide-over for Android/iOS) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-[88px] z-50 bg-ink/50 backdrop-blur-sm lg:hidden animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-4/5 max-w-xs h-full bg-surface border-r border-border p-4 sm:p-5 shadow-float overflow-y-auto flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="title-3 font-semibold text-ink">Store Navigation</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink rounded-lg"
                  aria-label="Close menu"
                >
                  <FontAwesomeIcon icon={Icons.close} className="h-4 w-4" />
                </button>
              </div>

              {/* Main Nav Links */}
              <div className="flex flex-col gap-1">
                <NavLink
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-quantum text-white font-semibold' : 'text-ink hover:bg-surface-alt'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={Icons.store} className="h-4 w-4" />
                  <span>{t.nav.home}</span>
                </NavLink>

                <NavLink
                  to="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-quantum text-white font-semibold' : 'text-ink hover:bg-surface-alt'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={Icons.category} className="h-4 w-4" />
                  <span>{t.nav.shop}</span>
                </NavLink>

                <NavLink
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-quantum text-white font-semibold' : 'text-ink hover:bg-surface-alt'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={Icons.cart} className="h-4 w-4" />
                    <span>{t.cart.title || 'Your Cart'}</span>
                  </div>
                  {totalCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-quantum-soft text-quantum font-bold text-xs">
                      {totalCount}
                    </span>
                  )}
                </NavLink>

                <NavLink
                  to="/track-order"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-quantum text-white font-semibold' : 'text-ink hover:bg-surface-alt'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={Icons.delivery} className="h-4 w-4" />
                  <span>{t.nav.trackOrder}</span>
                </NavLink>

                <NavLink
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-quantum text-white font-semibold' : 'text-ink hover:bg-surface-alt'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={Icons.user} className="h-4 w-4" />
                  <span>{t.nav.about}</span>
                </NavLink>

                <NavLink
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-quantum text-white font-semibold' : 'text-ink hover:bg-surface-alt'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={Icons.phone} className="h-4 w-4" />
                  <span>{t.nav.contact}</span>
                </NavLink>

                <NavLink
                  to="/policies"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-quantum text-white font-semibold' : 'text-ink hover:bg-surface-alt'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={Icons.shield} className="h-4 w-4" />
                  <span>{t.nav.policies}</span>
                </NavLink>

                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-quantum text-white font-semibold' : 'text-ink hover:bg-surface-alt'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={Icons.dashboard} className="h-4 w-4" />
                  <span>{t.nav.admin}</span>
                </NavLink>
              </div>

              {/* Categories Section in Drawer */}
              <div className="pt-3 border-t border-border">
                <span className="caption-4 uppercase font-semibold text-muted tracking-wider block mb-2 px-1">
                  {t.catalog.categories}
                </span>
                <div className="flex flex-col gap-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-ink hover:bg-quantum-soft hover:text-quantum"
                    >
                      <FontAwesomeIcon icon={getCatIcon(cat.iconName)} className="h-3 w-3 text-muted" />
                      <span>{language === 'bn' ? cat.nameBn : cat.nameEn}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Support Callouts */}
            <div className="pt-4 border-t border-border flex flex-col gap-1.5 text-xs">
              <a
                href="tel:01712345678"
                className="flex items-center gap-2 text-ink hover:text-quantum font-semibold py-1"
              >
                <FontAwesomeIcon icon={Icons.phone} className="text-quantum h-3.5 w-3.5" />
                <span>01712-345678</span>
              </a>
              <span className="caption-5 text-muted">Everyday: 10:00 AM - 10:00 PM</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

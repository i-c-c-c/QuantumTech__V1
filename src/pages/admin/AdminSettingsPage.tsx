import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { settingsService } from '../../services/settingsService';
import { StoreSettings } from '../../types';
import { setItem, STORAGE_KEYS } from '../../utilities/storage';
import { useToast } from '../../context/ToastContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Icons } from '../../utilities/icons';

export const AdminSettingsPage: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const { language, t } = useLanguage();
  const [settings, setSettings] = useState<StoreSettings>(() => settingsService.getSettings());

  // Admin Profile Fields
  const [adminName, setAdminName] = useState(adminUser?.name || 'Irfan Khan Shahil');
  const [adminEmail, setAdminEmail] = useState(adminUser?.email || 'admin@quantumtech.com');
  const [activeTab, setActiveTab] = useState<'store' | 'payment' | 'social' | 'profile'>('store');

  const { showToast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (settings.deliveryChargeInsideDhaka < 0 || settings.deliveryChargeOutsideDhaka < 0) {
      showToast('Delivery charges cannot be negative numbers.', 'error');
      return;
    }

    if (!settings.bKashNumber || !settings.nagadNumber) {
      showToast('bKash and Nagad account numbers are required.', 'error');
      return;
    }

    // Save Store Settings using settingsService
    settingsService.saveSettings(settings);

    // Save updated admin profile session if changed
    if (adminUser) {
      const updatedUser = {
        ...adminUser,
        name: adminName.trim(),
        email: adminEmail.trim(),
      };
      setItem(STORAGE_KEYS.ADMIN_SESSION, updatedUser);
    }

    showToast(t.admin.settings.saveSuccess, 'success');
  };

  return (
    <div className="max-w-5xl flex flex-col gap-6">
      {/* Top Header */}
      <div>
        <span className="caption-4 font-semibold text-quantum uppercase tracking-wider block mb-1">
          Store Configuration &amp; Channels
        </span>
        <h1 className="heading-4 sm:heading-3 font-bold text-ink">Store Settings</h1>
        <p className="caption-2 text-muted mt-0.5">
          Configure business details, mobile payment numbers, shipping rates, and social profiles
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'store'
              ? 'bg-quantum text-white shadow-xs'
              : 'bg-surface hover:bg-surface-alt text-slate-700 border border-border'
          }`}
        >
          <FontAwesomeIcon icon={Icons.store} className="mr-2 h-3.5 w-3.5" />
          <span>{language === 'bn' ? 'স্টোর তথ্য ও যোগাযোগ' : 'Store Information & Contact'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'payment'
              ? 'bg-quantum text-white shadow-xs'
              : 'bg-surface hover:bg-surface-alt text-slate-700 border border-border'
          }`}
        >
          <FontAwesomeIcon icon={Icons.money} className="mr-2 h-3.5 w-3.5" />
          <span>{language === 'bn' ? 'পেমেন্ট নম্বর ও ডেলিভারি' : 'Payment Numbers & Delivery'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'social'
              ? 'bg-quantum text-white shadow-xs'
              : 'bg-surface hover:bg-surface-alt text-slate-700 border border-border'
          }`}
        >
          <FontAwesomeIcon icon={Icons.share} className="mr-2 h-3.5 w-3.5" />
          <span>{language === 'bn' ? 'সামাজিক মাধ্যম লিংক' : 'Social Media Links'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-quantum text-white shadow-xs'
              : 'bg-surface hover:bg-surface-alt text-slate-700 border border-border'
          }`}
        >
          <FontAwesomeIcon icon={Icons.user} className="mr-2 h-3.5 w-3.5" />
          <span>{language === 'bn' ? 'অ্যাডমিন প্রোফাইল' : 'Admin Profile'}</span>
        </button>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Tab 1: Store Information & Contact Details */}
        {activeTab === 'store' && (
          <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-xs flex flex-col gap-5 animate-fadeIn">
            <div>
              <h2 className="title-2 font-bold text-ink mb-1 flex items-center gap-2">
                <FontAwesomeIcon icon={Icons.store} className="h-4 w-4 text-quantum" />
                <span>Store Information &amp; Brand Story</span>
              </h2>
              <p className="caption-3 text-muted">Customer-facing business branding shown in header, footer and about pages</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="caption-3 font-semibold text-ink block mb-1">Store Name *</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  required
                  className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum"
                />
              </div>

              <div>
                <label className="caption-3 font-semibold text-ink block mb-1">Brand Slogan</label>
                <input
                  type="text"
                  value={settings.slogan || "We Find The Tech So You Don't Have To."}
                  onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                  className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="caption-3 font-semibold text-ink block mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum"
                />
              </div>
            </div>

            <hr className="border-border my-1" />

            <div>
              <h3 className="title-3 font-bold text-ink mb-1 flex items-center gap-2">
                <FontAwesomeIcon icon={Icons.phone} className="h-3.5 w-3.5 text-quantum" />
                <span>Contact Details &amp; Operating Hours</span>
              </h3>
              <p className="caption-4 text-muted mb-4">Official phone, email, and location shown to customers</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="caption-3 font-semibold text-ink block mb-1">Customer Hotline Phone *</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    required
                    className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum font-mono"
                  />
                </div>

                <div>
                  <label className="caption-3 font-semibold text-ink block mb-1">Customer Support Email *</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    required
                    className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum"
                  />
                </div>

                <div>
                  <label className="caption-3 font-semibold text-ink block mb-1">Operating Business Hours *</label>
                  <input
                    type="text"
                    value={settings.businessHours}
                    onChange={(e) => setSettings({ ...settings, businessHours: e.target.value })}
                    required
                    className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum"
                  />
                </div>

                <div>
                  <label className="caption-3 font-semibold text-ink block mb-1">Store / Office Address *</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    required
                    className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Configurable Payment Numbers & Delivery Charges */}
        {activeTab === 'payment' && (
          <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-xs flex flex-col gap-6 animate-fadeIn">
            {/* Payment Numbers */}
            <div>
              <h2 className="title-2 font-bold text-ink mb-1 flex items-center gap-2">
                <FontAwesomeIcon icon={Icons.money} className="h-4 w-4 text-quantum" />
                <span>Configurable Mobile Payment Numbers</span>
              </h2>
              <p className="caption-4 text-muted mb-4">
                These numbers and instructions appear during customer guest checkout for bKash and Nagad payments.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="caption-3 font-semibold text-ink block mb-1">bKash Account Number *</label>
                  <input
                    type="text"
                    value={settings.bKashNumber}
                    onChange={(e) => setSettings({ ...settings, bKashNumber: e.target.value })}
                    required
                    className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum font-mono"
                  />
                  <span className="caption-5 text-muted mt-1 block">Account type: Personal (Send Money)</span>
                </div>

                <div>
                  <label className="caption-3 font-semibold text-ink block mb-1">Nagad Account Number *</label>
                  <input
                    type="text"
                    value={settings.nagadNumber}
                    onChange={(e) => setSettings({ ...settings, nagadNumber: e.target.value })}
                    required
                    className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum font-mono"
                  />
                  <span className="caption-5 text-muted mt-1 block">Account type: Personal (Send Money)</span>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Delivery Charges */}
            <div>
              <h2 className="title-2 font-bold text-ink mb-1 flex items-center gap-2">
                <FontAwesomeIcon icon={Icons.delivery} className="h-4 w-4 text-quantum" />
                <span>Delivery Charges (BDT)</span>
              </h2>
              <p className="caption-4 text-muted mb-4">
                Configurable sample delivery tariffs automatically applied at customer checkout.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="caption-3 font-semibold text-ink block mb-1">Inside Dhaka Delivery Charge (BDT) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={settings.deliveryChargeInsideDhaka}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          deliveryChargeInsideDhaka: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      required
                      className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum font-bold pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted font-bold">৳</span>
                  </div>
                  <span className="caption-5 text-muted mt-1 block">Standard turnaround: 24 to 48 hours</span>
                </div>

                <div>
                  <label className="caption-3 font-semibold text-ink block mb-1">Outside Dhaka Delivery Charge (BDT) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={settings.deliveryChargeOutsideDhaka}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          deliveryChargeOutsideDhaka: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      required
                      className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum font-bold pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted font-bold">৳</span>
                  </div>
                  <span className="caption-5 text-muted mt-1 block">Nationwide turnaround: 2 to 4 business days</span>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Thresholds & Alerts */}
            <div>
              <h3 className="title-3 font-bold text-ink mb-1 flex items-center gap-2">
                <FontAwesomeIcon icon={Icons.warning} className="h-3.5 w-3.5 text-quantum" />
                <span>Inventory Thresholds &amp; Owner Alerts</span>
              </h3>
              <p className="caption-4 text-muted mb-4">
                Immediate order notification recipient email and inventory safety thresholds.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="caption-3 font-semibold text-ink block mb-1">Owner Alert Email (FR-28) *</label>
                  <input
                    type="email"
                    value={settings.ownerNotificationEmail}
                    onChange={(e) => setSettings({ ...settings, ownerNotificationEmail: e.target.value })}
                    required
                    className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum"
                  />
                </div>

                <div>
                  <label className="caption-3 font-semibold text-ink block mb-1">Low-Stock Warning Threshold (Units) *</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.lowStockThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        lowStockThreshold: parseInt(e.target.value, 10) || 5,
                      })
                    }
                    required
                    className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum"
                  />
                  <span className="caption-5 text-muted mt-1 block">Default: 5 units or fewer triggers low stock alert</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Social Media Links */}
        {activeTab === 'social' && (
          <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-xs flex flex-col gap-5 animate-fadeIn">
            <div>
              <h2 className="title-2 font-bold text-ink mb-1 flex items-center gap-2">
                <FontAwesomeIcon icon={Icons.share} className="h-4 w-4 text-quantum" />
                <span>Social Media &amp; Chat Channels</span>
              </h2>
              <p className="caption-3 text-muted">Links rendered in storefront header, footer, contact, and product inquiry buttons</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="caption-3 font-semibold text-ink block mb-1 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={Icons.facebook} className="h-3.5 w-3.5 text-blue-600" />
                  <span>Facebook Page URL</span>
                </label>
                <input
                  type="url"
                  value={settings.facebookUrl}
                  onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                  placeholder="https://facebook.com/..."
                  className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum"
                />
              </div>

              <div>
                <label className="caption-3 font-semibold text-ink block mb-1 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={Icons.instagram} className="h-3.5 w-3.5 text-pink-600" />
                  <span>Instagram Profile URL</span>
                </label>
                <input
                  type="url"
                  value={settings.instagramUrl}
                  onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum"
                />
              </div>

              <div>
                <label className="caption-3 font-semibold text-ink block mb-1 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={Icons.whatsapp} className="h-3.5 w-3.5 text-emerald-600" />
                  <span>WhatsApp Contact Phone Number</span>
                </label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="+880 1712-345678"
                  className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum font-mono"
                />
              </div>

              <div>
                <label className="caption-3 font-semibold text-ink block mb-1 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={Icons.messenger} className="h-3.5 w-3.5 text-blue-500" />
                  <span>Facebook Messenger Link</span>
                </label>
                <input
                  type="url"
                  value={settings.messengerUrl}
                  onChange={(e) => setSettings({ ...settings, messengerUrl: e.target.value })}
                  placeholder="https://m.me/..."
                  className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Admin Profile Settings */}
        {activeTab === 'profile' && (
          <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-xs flex flex-col gap-5 animate-fadeIn">
            <div>
              <h2 className="title-2 font-bold text-ink mb-1 flex items-center gap-2">
                <FontAwesomeIcon icon={Icons.user} className="h-4 w-4 text-quantum" />
                <span>Store Owner Administrator Profile</span>
              </h2>
              <p className="caption-3 text-muted">Update administrator credentials and session details</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="caption-3 font-semibold text-ink block mb-1">Administrator Full Name *</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum"
                />
              </div>

              <div>
                <label className="caption-3 font-semibold text-ink block mb-1">Administrator Email *</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border p-2.5 text-xs text-ink focus:outline-none focus:border-quantum"
                />
              </div>

              <div>
                <label className="caption-3 font-semibold text-ink block mb-1">Role / Authority</label>
                <input
                  type="text"
                  disabled
                  value="Store Owner (Full Administrative Access)"
                  className="w-full rounded-xl border border-border p-2.5 text-xs text-slate-500 bg-slate-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="caption-3 font-semibold text-ink block mb-1">Admin Demo Passcode</label>
                <input
                  type="text"
                  disabled
                  value="admin123 (Active)"
                  className="w-full rounded-xl border border-border p-2.5 text-xs text-slate-500 bg-slate-100 cursor-not-allowed font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Changes Floating Action Bar */}
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs flex items-center justify-between">
          <span className="caption-3 text-muted">
            All configuration updates immediately synchronize to customer pages.
          </span>
          <button
            type="submit"
            className="btn-base bg-quantum text-white hover:bg-quantum-hover button-md shadow-sm font-semibold px-6"
          >
            <FontAwesomeIcon icon={Icons.check} className="h-4 w-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

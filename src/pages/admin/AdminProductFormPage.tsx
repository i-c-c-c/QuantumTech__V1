import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { Product, ProductVariant, Category } from '../../types';
import { Icons } from '../../utilities/icons';

interface AdminProductFormPageProps {
  isEdit?: boolean;
}

export const AdminProductFormPage: React.FC<AdminProductFormPageProps> = ({ isEdit = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>(() => productService.getCategories());
  const [loading, setLoading] = useState(isEdit);

  // Form Fields
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [categoryId, setCategoryId] = useState('cat-chargers');
  const [price, setPrice] = useState<number | string>(1200);
  const [oldPrice, setOldPrice] = useState<number | string>('');
  const [stock, setStock] = useState<number | string>(15);
  const [tagsInput, setTagsInput] = useState('Fast Charging, USB-C');
  const [status, setStatus] = useState<'Active' | 'Hidden'>('Active');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(true);

  // Descriptions
  const [description, setDescription] = useState('');
  const [descriptionBn, setDescriptionBn] = useState('');

  // Images (Up to 6)
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Specifications (Key-Value)
  const [specList, setSpecList] = useState<Array<{ key: string; value: string }>>([
    { key: 'Output Power', value: '20W Fast Charging' },
    { key: 'Port Type', value: 'USB Type-C Power Delivery' },
    { key: 'Warranty', value: '6 Months Replacement Warranty' },
  ]);

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Automatically derive total stock from variants
  const hasVariants = variants.length > 0;
  const variantTotalStock = variants.reduce(
    (sum, v) => sum + Math.max(0, Math.floor(Number(v.stock) || 0)),
    0
  );

  // Synchronize stock state whenever variants change
  useEffect(() => {
    if (hasVariants) {
      setStock(variantTotalStock);
    }
  }, [hasVariants, variantTotalStock]);

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load product data if editing
  useEffect(() => {
    if (isEdit && id) {
      const existing = productService.getProductById(id);
      if (existing) {
        setName(existing.name);
        setNameBn(existing.nameBn);
        setCategoryId(existing.categoryId);
        setPrice(existing.price);
        setOldPrice(existing.oldPrice || '');
        const loadedVariants = existing.variants || [];
        setVariants(loadedVariants);
        // If product has variants, calculate total stock automatically; otherwise use stored stock
        if (loadedVariants.length > 0) {
          setStock(productService.calculateTotalStock(loadedVariants));
        } else {
          setStock(existing.stock);
        }
        setTagsInput((existing.tags || []).join(', '));
        setStatus(existing.status === 'Hidden' ? 'Hidden' : 'Active');
        setIsFeatured(!!existing.isFeatured);
        setIsNew(!!existing.isNew);
        setDescription(existing.description || '');
        setDescriptionBn(existing.descriptionBn || '');
        setImages(existing.images && existing.images.length > 0 ? existing.images : [
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'
        ]);

        // Convert specifications object to array
        const specs = Object.entries(existing.specifications || {}).map(([key, value]) => ({
          key,
          value,
        }));
        setSpecList(specs.length > 0 ? specs : [{ key: 'Power Output', value: '20W' }]);
      } else {
        showToast('Product not found or has been deleted.', 'error');
        navigate('/admin/products');
      }
      setLoading(false);
    }
  }, [isEdit, id, navigate, showToast]);

  // Handle Image Add
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    if (images.length >= 6) {
      showToast('Maximum of 6 images allowed per product.', 'error');
      return;
    }
    const cleanUrl = newImageUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      showToast('Image URL must start with http:// or https://', 'error');
      return;
    }
    setImages([...images, cleanUrl]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    if (images.length === 1) {
      showToast('At least 1 product image is required.', 'error');
      return;
    }
    setImages(images.filter((_, i) => i !== index));
  };

  const handleMakeCoverImage = (index: number) => {
    const selected = images[index];
    const rest = images.filter((_, i) => i !== index);
    setImages([selected, ...rest]);
    showToast('Cover image updated.', 'info');
  };

  // Preset Curated Image selection for easy testing
  const addCuratedPreset = (url: string) => {
    if (images.length >= 6) {
      showToast('Maximum 6 images reached.', 'warning');
      return;
    }
    setImages([...images, url]);
    showToast('Sample image added to gallery.', 'success');
  };

  // Specifications Row Helpers
  const handleAddSpecRow = () => {
    setSpecList([...specList, { key: '', value: '' }]);
  };

  const handleUpdateSpec = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...specList];
    updated[index][field] = val;
    setSpecList(updated);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecList(specList.filter((_, i) => i !== index));
  };

  // Variants Row Helpers
  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: id || 'temp',
      attribute: 'colour',
      value: `Variant ${variants.length + 1}`,
      valueBn: `ভেরিয়েন্ট ${variants.length + 1}`,
      price: Number(price) || 1200,
      stock: 2,
      image: images[0] || '',
    };
    const updated = [...variants, newVariant];
    setVariants(updated);
    setStock(updated.reduce((sum, v) => sum + Math.max(0, Math.floor(Number(v.stock) || 0)), 0));
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, val: any) => {
    const updated = [...variants];
    if (field === 'stock') {
      const parsed = typeof val === 'number' ? val : Number(val);
      val = isNaN(parsed) ? 0 : Math.max(0, Math.floor(parsed));
    } else if (field === 'price') {
      const parsed = typeof val === 'number' ? val : Number(val);
      val = isNaN(parsed) ? 0 : Math.max(0, parsed);
    }
    (updated[index] as any)[field] = val;
    setVariants(updated);
    setStock(updated.reduce((sum, v) => sum + Math.max(0, Math.floor(Number(v.stock) || 0)), 0));
  };

  const handleRemoveVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    setVariants(updated);
    if (updated.length > 0) {
      setStock(updated.reduce((sum, v) => sum + Math.max(0, Math.floor(Number(v.stock) || 0)), 0));
    }
  };

  // Validation & Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'English product name is required';
    if (!nameBn.trim()) newErrors.nameBn = 'Bangla product name is required';

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      newErrors.price = 'Price must be greater than zero (0 BDT)';
    }

    const calculatedTotalStock = hasVariants
      ? variants.reduce((sum, v) => sum + Math.max(0, Math.floor(Number(v.stock) || 0)), 0)
      : Math.max(0, Math.floor(Number(stock) || 0));

    if (!hasVariants) {
      const numStock = Number(stock);
      if (isNaN(numStock) || numStock < 0) {
        newErrors.stock = 'Stock cannot be negative';
      }
    }

    if (oldPrice) {
      const numOld = Number(oldPrice);
      if (!isNaN(numOld) && numOld > 0 && numOld < numPrice) {
        newErrors.oldPrice = 'Previous price must be equal or higher than the current price';
      }
    }

    if (!description.trim()) newErrors.description = 'English description is required';
    if (!descriptionBn.trim()) newErrors.descriptionBn = 'Bangla description is required';

    if (images.length === 0) {
      newErrors.images = 'At least 1 product image is required';
    } else if (images.length > 6) {
      newErrors.images = 'A maximum of 6 images are supported';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please fix the validation errors before saving.', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    // Convert spec array back to Record
    const specRecord: Record<string, string> = {};
    specList.forEach(s => {
      if (s.key.trim() && s.value.trim()) {
        specRecord[s.key.trim()] = s.value.trim();
      }
    });

    // Parse tags
    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const productPayload: Partial<Product> & { name: string; price: number; stock: number; categoryId: string } = {
      ...(isEdit && id ? { id } : {}),
      name: name.trim(),
      nameBn: nameBn.trim(),
      categoryId,
      price: numPrice,
      oldPrice: oldPrice ? Number(oldPrice) : undefined,
      stock: calculatedTotalStock,
      tags: parsedTags,
      status,
      isFeatured,
      isNew,
      description: description.trim(),
      descriptionBn: descriptionBn.trim(),
      images,
      specifications: specRecord,
      variants: variants.map(v => ({
        ...v,
        stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
        price: Math.max(0, Number(v.price) || 0),
      })),
    };

    const saved = productService.saveProduct(productPayload);
    setIsSubmitting(false);

    showToast(
      isEdit ? `Product "${saved.name}" updated successfully!` : `New product "${saved.name}" added to catalog!`,
      'success'
    );

    navigate('/admin/products');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <FontAwesomeIcon icon={Icons.spinner} className="h-8 w-8 text-quantum animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/admin/products" className="caption-3 text-muted hover:text-quantum flex items-center gap-1">
              <FontAwesomeIcon icon={Icons.chevronLeft} className="h-2.5 w-2.5" />
              <span>Back to Products</span>
            </Link>
          </div>
          <h1 className="heading-5 sm:heading-4 font-bold text-ink">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="caption-2 text-muted mt-0.5">
            {isEdit
              ? 'Update specifications, pricing, stock, variants, and imagery.'
              : 'Add a new verified tech accessory to the QuantumTech catalog.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="btn-base bg-surface border border-border text-ink hover:bg-surface-muted button-md"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-base bg-quantum text-white hover:bg-quantum-hover button-md shadow-sm font-semibold"
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon icon={Icons.spinner} className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={Icons.check} className="h-4 w-4" />
                <span>{isEdit ? 'Save Changes' : 'Publish Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Form Form Grid */}
      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Core Fields (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Card 1: Basic Information */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs">
            <h2 className="title-2 font-bold text-ink mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={Icons.tag} className="h-4 w-4 text-quantum" />
              <span>Basic Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* English Name */}
              <div>
                <label className="caption-3 font-semibold text-ink block mb-1">
                  Product Name (English) <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Quantum GaN 65W Fast Charger"
                  required
                  className={`w-full rounded-xl border p-2.5 text-sm text-ink focus:outline-none focus:ring-2 ${
                    errors.name ? 'border-error bg-error-soft/20 focus:ring-error-soft' : 'border-border focus:border-quantum focus:ring-quantum-soft'
                  }`}
                />
                {errors.name && <p className="caption-5 text-error mt-1">{errors.name}</p>}
              </div>

              {/* Bangla Name */}
              <div>
                <label className="caption-3 font-semibold text-ink block mb-1">
                  Product Name (Bangla) <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={nameBn}
                  onChange={(e) => {
                    setNameBn(e.target.value);
                    if (errors.nameBn) setErrors(prev => ({ ...prev, nameBn: '' }));
                  }}
                  placeholder="e.g. কোয়ান্টাম গ্যান ৬৫ ওয়াট ফাস্ট চার্জার"
                  required
                  className={`w-full rounded-xl border p-2.5 text-sm text-ink focus:outline-none focus:ring-2 ${
                    errors.nameBn ? 'border-error bg-error-soft/20 focus:ring-error-soft' : 'border-border focus:border-quantum focus:ring-quantum-soft'
                  }`}
                />
                {errors.nameBn && <p className="caption-5 text-error mt-1">{errors.nameBn}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="caption-3 font-semibold text-ink block mb-1">
                  Category <span className="text-error">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-border p-2.5 text-sm text-ink focus:outline-none focus:border-quantum focus:ring-2 focus:ring-quantum-soft bg-surface"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} ({c.nameBn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="caption-3 font-semibold text-ink block mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Fast Charging, GaN, USB-C"
                  className="w-full rounded-xl border border-border p-2.5 text-sm text-ink focus:outline-none focus:border-quantum focus:ring-2 focus:ring-quantum-soft"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Pricing & Stock */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs">
            <h2 className="title-2 font-bold text-ink mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={Icons.money} className="h-4 w-4 text-quantum" />
              <span>Pricing &amp; Inventory</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Price */}
              <div>
                <label className="caption-3 font-semibold text-ink block mb-1">
                  Current Price (BDT) <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
                    }}
                    placeholder="1200"
                    required
                    className={`w-full rounded-xl border p-2.5 text-sm text-ink focus:outline-none focus:ring-2 ${
                      errors.price ? 'border-error bg-error-soft/20 focus:ring-error-soft' : 'border-border focus:border-quantum focus:ring-quantum-soft'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted font-bold">৳</span>
                </div>
                {errors.price && <p className="caption-5 text-error mt-1">{errors.price}</p>}
              </div>

              {/* Old Price */}
              <div>
                <label className="caption-3 font-semibold text-ink block mb-1">
                  Old Price (BDT, Optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={oldPrice}
                    onChange={(e) => {
                      setOldPrice(e.target.value);
                      if (errors.oldPrice) setErrors(prev => ({ ...prev, oldPrice: '' }));
                    }}
                    placeholder="e.g. 1500"
                    className={`w-full rounded-xl border p-2.5 text-sm text-ink focus:outline-none focus:ring-2 ${
                      errors.oldPrice ? 'border-error bg-error-soft/20 focus:ring-error-soft' : 'border-border focus:border-quantum focus:ring-quantum-soft'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted font-bold">৳</span>
                </div>
                {errors.oldPrice && <p className="caption-5 text-error mt-1">{errors.oldPrice}</p>}
              </div>

              {/* Stock */}
              <div>
                <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                  <label htmlFor="main-product-stock" className="caption-3 font-semibold text-ink block">
                    Total Stock Quantity <span className="text-error">*</span>
                  </label>
                  {hasVariants && (
                    <span
                      data-testid="variants-stock-badge"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-quantum-soft text-quantum border border-quantum/20"
                    >
                      <FontAwesomeIcon icon={Icons.refresh} className="h-3 w-3 text-quantum" />
                      <span>Total Stock (Automatically calculated from variants)</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    id="main-product-stock"
                    data-testid="main-product-stock-input"
                    type="number"
                    min="0"
                    step="1"
                    value={hasVariants ? variantTotalStock : stock}
                    disabled={hasVariants}
                    readOnly={hasVariants}
                    onChange={(e) => {
                      if (!hasVariants) {
                        setStock(e.target.value);
                        if (errors.stock) setErrors(prev => ({ ...prev, stock: '' }));
                      }
                    }}
                    placeholder="10"
                    required
                    className={`w-full rounded-xl border p-2.5 text-sm text-ink transition-all ${
                      hasVariants
                        ? 'bg-slate-100 text-slate-800 cursor-not-allowed border-slate-300 font-bold select-none pr-28'
                        : errors.stock
                        ? 'border-error bg-error-soft/20 focus:ring-error-soft focus:outline-none focus:ring-2'
                        : 'border-border focus:border-quantum focus:ring-quantum-soft focus:outline-none focus:ring-2 bg-surface'
                    }`}
                  />
                  {hasVariants && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-muted pointer-events-none select-none">
                      <FontAwesomeIcon icon={Icons.lock} className="h-3 w-3 text-slate-400" />
                      <span className="caption-5 font-semibold text-slate-500">Auto-calculated</span>
                    </div>
                  )}
                </div>

                {/* Status Helpers & Stock Alerts */}
                {hasVariants ? (
                  <div className="mt-1.5 flex flex-col gap-1">
                    <p className="caption-5 text-quantum flex items-center gap-1.5 font-medium">
                      <FontAwesomeIcon icon={Icons.circleCheck} className="h-3 w-3 text-quantum flex-shrink-0" />
                      <span>
                        Total Stock (Automatically calculated from variants: {variantTotalStock} units across {variants.length} variant{variants.length === 1 ? '' : 's'}).
                      </span>
                    </p>
                    {variantTotalStock === 0 ? (
                      <span className="caption-5 text-error font-semibold flex items-center gap-1.5">
                        <FontAwesomeIcon icon={Icons.error} className="h-3 w-3 flex-shrink-0" />
                        <span>All variants are at 0 stock. Product status is Out of Stock.</span>
                      </span>
                    ) : variantTotalStock <= 5 ? (
                      <span className="caption-5 text-amber-700 font-semibold flex items-center gap-1.5">
                        <FontAwesomeIcon icon={Icons.warning} className="h-3 w-3 flex-shrink-0" />
                        <span>Low Stock Warning: Total variant stock is &le; 5 units.</span>
                      </span>
                    ) : (
                      <span className="caption-5 text-emerald-700 font-semibold flex items-center gap-1.5">
                        <FontAwesomeIcon icon={Icons.circleCheck} className="h-3 w-3 flex-shrink-0" />
                        <span>In Stock: Available for storefront purchase.</span>
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-1.5">
                    {errors.stock && <p className="caption-5 text-error">{errors.stock}</p>}
                    {Number(stock) <= 5 && Number(stock) > 0 && (
                      <span className="caption-5 text-amber-600 block mt-1 font-semibold flex items-center gap-1.5">
                        <FontAwesomeIcon icon={Icons.warning} className="h-3 w-3 flex-shrink-0" />
                        <span>Warning: Stock &le; 5 flags this item as Low Stock.</span>
                      </span>
                    )}
                    {Number(stock) === 0 && (
                      <span className="caption-5 text-error block mt-1 font-semibold flex items-center gap-1.5">
                        <FontAwesomeIcon icon={Icons.error} className="h-3 w-3 flex-shrink-0" />
                        <span>Note: Product will show as Out of Stock.</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Descriptions */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col gap-4">
            <h2 className="title-2 font-bold text-ink flex items-center gap-2">
              <FontAwesomeIcon icon={Icons.comment} className="h-4 w-4 text-quantum" />
              <span>Product Descriptions</span>
            </h2>

            <div>
              <label className="caption-3 font-semibold text-ink block mb-1">
                English Description <span className="text-error">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                }}
                placeholder="Detailed technical features, build quality, and verified output specifications..."
                className={`w-full rounded-xl border p-3 text-sm text-ink focus:outline-none focus:ring-2 ${
                  errors.description ? 'border-error bg-error-soft/20 focus:ring-error-soft' : 'border-border focus:border-quantum focus:ring-quantum-soft'
                }`}
              />
              {errors.description && <p className="caption-5 text-error mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="caption-3 font-semibold text-ink block mb-1">
                Bangla Description <span className="text-error">*</span>
              </label>
              <textarea
                rows={4}
                value={descriptionBn}
                onChange={(e) => {
                  setDescriptionBn(e.target.value);
                  if (errors.descriptionBn) setErrors(prev => ({ ...prev, descriptionBn: '' }));
                }}
                placeholder="পণ্যের বিস্তারিত বিবরণ, সুবিধা এবং ওয়ারেন্টি সংক্রান্ত তথ্য বাংলায় লিখুন..."
                className={`w-full rounded-xl border p-3 text-sm text-ink focus:outline-none focus:ring-2 ${
                  errors.descriptionBn ? 'border-error bg-error-soft/20 focus:ring-error-soft' : 'border-border focus:border-quantum focus:ring-quantum-soft'
                }`}
              />
              {errors.descriptionBn && <p className="caption-5 text-error mt-1">{errors.descriptionBn}</p>}
            </div>
          </div>

          {/* Card 4: Technical Specifications */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="title-2 font-bold text-ink flex items-center gap-2">
                  <FontAwesomeIcon icon={Icons.sliders} className="h-4 w-4 text-quantum" />
                  <span>Technical Specifications</span>
                </h2>
                <p className="caption-4 text-muted">Key-value hardware parameters shown on product details</p>
              </div>
              <button
                type="button"
                onClick={handleAddSpecRow}
                className="btn-base bg-surface border border-border text-ink hover:bg-surface-muted button-xsm font-semibold"
              >
                <FontAwesomeIcon icon={Icons.plus} className="h-3 w-3" />
                <span>Add Spec</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {specList.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleUpdateSpec(idx, 'key', e.target.value)}
                    placeholder="e.g. Power Output"
                    className="w-1/3 rounded-xl border border-border p-2 text-xs text-ink focus:outline-none focus:border-quantum"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                    placeholder="e.g. 65W Max Fast Charge"
                    className="flex-1 rounded-xl border border-border p-2 text-xs text-ink focus:outline-none focus:border-quantum"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="p-2 text-muted hover:text-error transition-colors"
                    title="Remove specification"
                  >
                    <FontAwesomeIcon icon={Icons.close} className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Variants (Color, Model, Size) */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="title-2 font-bold text-ink flex items-center gap-2">
                  <FontAwesomeIcon icon={Icons.category} className="h-4 w-4 text-quantum" />
                  <span>Product Variants (Color / Model / Size)</span>
                </h2>
                <p className="caption-4 text-muted">Variants update price, stock, and imagery dynamically</p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                data-testid="add-variant-btn"
                className="btn-base bg-surface border border-border text-ink hover:bg-surface-muted button-xsm font-semibold"
              >
                <FontAwesomeIcon icon={Icons.plus} className="h-3 w-3" />
                <span>Add Variant</span>
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="caption-3 text-muted italic bg-surface-alt p-4 rounded-xl text-center">
                No variants configured. Product will be sold as a single standard unit.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {variants.map((v, idx) => (
                  <div
                    key={v.id || idx}
                    data-testid={`variant-row-${idx}`}
                    className={`p-3.5 rounded-xl border flex flex-wrap items-center gap-3 transition-colors ${
                      v.stock === 0 ? 'bg-error-soft/10 border-error/30' : 'bg-surface-alt border-border'
                    }`}
                  >
                    <select
                      value={v.attribute}
                      data-testid={`variant-attribute-select-${idx}`}
                      onChange={(e) => handleUpdateVariant(idx, 'attribute', e.target.value)}
                      className="rounded-lg border border-border p-1.5 text-xs text-ink bg-surface"
                    >
                      <option value="colour">Color</option>
                      <option value="model">Model</option>
                      <option value="size">Size</option>
                    </select>

                    <input
                      type="text"
                      data-testid={`variant-name-input-${idx}`}
                      value={v.value}
                      onChange={(e) => handleUpdateVariant(idx, 'value', e.target.value)}
                      placeholder="Variant (e.g. Midnight Black)"
                      className="rounded-lg border border-border p-1.5 text-xs text-ink flex-1 min-w-[120px] bg-surface"
                    />

                    <input
                      type="text"
                      data-testid={`variant-namebn-input-${idx}`}
                      value={v.valueBn || ''}
                      onChange={(e) => handleUpdateVariant(idx, 'valueBn', e.target.value)}
                      placeholder="বাংলা নাম"
                      className="rounded-lg border border-border p-1.5 text-xs text-ink w-24 bg-surface"
                    />

                    <div className="flex items-center gap-1">
                      <span className="caption-5 text-muted font-medium">Price:</span>
                      <input
                        type="number"
                        min="0"
                        data-testid={`variant-price-input-${idx}`}
                        value={v.price}
                        onChange={(e) => handleUpdateVariant(idx, 'price', Number(e.target.value))}
                        className="rounded-lg border border-border p-1.5 text-xs text-ink w-20 font-bold bg-surface"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="caption-5 text-muted font-medium">Stock:</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        data-testid={`variant-stock-input-${idx}`}
                        value={v.stock}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                          handleUpdateVariant(idx, 'stock', val);
                        }}
                        className={`rounded-lg border p-1.5 text-xs text-ink w-16 font-semibold bg-surface ${
                          v.stock === 0 ? 'border-error text-error bg-error-soft/30' : 'border-border'
                        }`}
                      />
                      {v.stock === 0 ? (
                        <span className="caption-5 px-1.5 py-0.5 rounded bg-error-soft text-error font-bold text-[10px] whitespace-nowrap">
                          Out
                        </span>
                      ) : (
                        <span className="caption-5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] whitespace-nowrap">
                          In
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      data-testid={`remove-variant-btn-${idx}`}
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-1.5 text-muted hover:text-error transition-colors"
                      title="Remove variant"
                    >
                      <FontAwesomeIcon icon={Icons.trash} className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Gallery & Publishing (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card: Status & Visibility */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs flex flex-col gap-4">
            <h3 className="title-3 font-bold text-ink">Publishing Settings</h3>

            <div>
              <label className="caption-4 font-semibold text-slate-700 block mb-1">Catalog Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-border p-2.5 text-xs text-ink bg-surface focus:outline-none focus:border-quantum font-semibold"
              >
                <option value="Active">Active (Visible in Storefront)</option>
                <option value="Hidden">Hidden (Draft / Unpublished)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-quantum focus:ring-quantum h-4 w-4"
                />
                <span className="font-medium">Feature on Homepage</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(e) => setIsNew(e.target.checked)}
                  className="rounded text-quantum focus:ring-quantum h-4 w-4"
                />
                <span className="font-medium">Mark as New Arrival</span>
              </label>
            </div>
          </div>

          {/* Card: Images (Up to 6) */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="title-3 font-bold text-ink">Product Gallery</h3>
              <span className="caption-4 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                {images.length} / 6
              </span>
            </div>

            <p className="caption-4 text-muted leading-snug">
              Supports up to 6 high-resolution product images. The first image is the cover.
            </p>

            {errors.images && <p className="caption-5 text-error">{errors.images}</p>}

            {/* Image Preview Grid */}
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-border aspect-square bg-slate-50">
                  <img src={img} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                  
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 caption-5 px-1.5 py-0.5 rounded bg-quantum text-white font-bold text-[10px]">
                      Cover
                    </span>
                  )}

                  <div className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleMakeCoverImage(idx)}
                        className="p-1 rounded bg-white text-ink text-[10px] hover:bg-quantum hover:text-white"
                        title="Set as cover image"
                      >
                        <FontAwesomeIcon icon={Icons.star} className="h-2.5 w-2.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1 rounded bg-error text-white text-[10px] hover:bg-error-dark"
                      title="Delete image"
                    >
                      <FontAwesomeIcon icon={Icons.trash} className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Image URL Input */}
            {images.length < 6 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <label className="caption-5 font-semibold text-slate-600">Add Image URL:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-xl border border-border p-2 text-xs text-ink focus:outline-none focus:border-quantum"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="btn-base bg-quantum text-white hover:bg-quantum-hover button-xsm font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Quick Sample Presets (For fast testing) */}
            {images.length < 6 && (
              <div className="pt-2 border-t border-border">
                <span className="caption-5 text-muted block mb-1.5 font-semibold">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => addCuratedPreset('https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80')}
                    className="caption-5 px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-quantum hover:text-white transition-colors"
                  >
                    + Charger
                  </button>
                  <button
                    type="button"
                    onClick={() => addCuratedPreset('https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80')}
                    className="caption-5 px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-quantum hover:text-white transition-colors"
                  >
                    + Earbuds
                  </button>
                  <button
                    type="button"
                    onClick={() => addCuratedPreset('https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80')}
                    className="caption-5 px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-quantum hover:text-white transition-colors"
                  >
                    + Smartwatch
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

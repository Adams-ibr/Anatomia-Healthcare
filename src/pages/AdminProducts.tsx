import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, ChevronLeft, ChevronRight, DollarSign, Loader2,
  Package, PencilLine, Plus, Search, ShoppingCart, Trash2
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal, Skeleton } from '../components/ui'
import { cn, formatPrice } from '../lib/utils'
import { productsApi } from '../lib/supabase'

type ProductStatus = 'available' | 'out_of_stock' | 'discontinued'

interface Product {
  id: string
  name: string
  sku: string
  description: string
  category: string
  price: number
  costPrice?: number
  stock: number
  lowStockThreshold: number
  imageUrl?: string
  status: ProductStatus
  salesCount: number
  isDigital: boolean
  createdAt: string
  updatedAt: string
}

const STATUS_BADGE: Record<ProductStatus, 'success' | 'warning' | 'line'> = {
  available: 'success',
  out_of_stock: 'warning',
  discontinued: 'line'
}

export default function AdminProducts() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 20
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all')

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [mutating, setMutating] = useState(false)

  const categories = ['Books', 'Models', 'Charts', 'Software', 'Merchandise', 'Digital Content']

  // Mock data
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Complete Anatomy Atlas - Hardcover',
          sku: 'BOOK-AA-001',
          description: 'Comprehensive illustrated anatomy reference book with over 1000 detailed diagrams',
          category: 'Books',
          price: 89.99,
          costPrice: 45.00,
          stock: 156,
          lowStockThreshold: 20,
          imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
          status: 'available',
          salesCount: 342,
          isDigital: false,
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: '3D Heart Model',
          sku: 'MODEL-HEART-001',
          description: 'Life-size anatomical heart model with removable parts',
          category: 'Models',
          price: 149.99,
          costPrice: 75.00,
          stock: 42,
          lowStockThreshold: 10,
          imageUrl: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400',
          status: 'available',
          salesCount: 87,
          isDigital: false,
          createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Muscular System Wall Chart',
          sku: 'CHART-MS-001',
          description: 'Large format laminated wall chart showing all major muscle groups',
          category: 'Charts',
          price: 34.99,
          costPrice: 12.00,
          stock: 8,
          lowStockThreshold: 15,
          imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400',
          status: 'available',
          salesCount: 234,
          isDigital: false,
          createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          name: 'Anatomy VR Software License',
          sku: 'SOFT-VR-001',
          description: 'Virtual reality anatomy exploration software - Annual license',
          category: 'Software',
          price: 299.99,
          stock: 999,
          lowStockThreshold: 0,
          status: 'available',
          salesCount: 156,
          isDigital: true,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          name: 'Skeleton Model - Full Size',
          sku: 'MODEL-SKEL-001',
          description: 'Life-size human skeleton model on stand',
          category: 'Models',
          price: 799.99,
          costPrice: 450.00,
          stock: 0,
          lowStockThreshold: 5,
          status: 'out_of_stock',
          salesCount: 23,
          isDigital: false,
          createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '6',
          name: 'Anatomia T-Shirt - Blue',
          sku: 'MERCH-TS-BLU',
          description: 'Premium cotton t-shirt with anatomical heart design',
          category: 'Merchandise',
          price: 24.99,
          costPrice: 8.00,
          stock: 87,
          lowStockThreshold: 25,
          status: 'available',
          salesCount: 412,
          isDigital: false,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      let filtered = mockProducts
      if (search) {
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.category === categoryFilter)
      }
      if (statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === statusFilter)
      }

      setProducts(filtered)
      setTotal(filtered.length)
      setLoading(false)
    }, 500)
  }, [search, categoryFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const handleDelete = (product: Product) => {
    setMutating(true)
    setTimeout(() => {
      setProducts(products.filter(p => p.id !== product.id))
      setDeleting(null)
      setMutating(false)
      toast('Success', `Product "${product.name}" deleted`)
    }, 500)
  }

  const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.salesCount), 0)
  const totalProfit = products.reduce((sum, p) => sum + ((p.price - (p.costPrice || 0)) * p.salesCount), 0)
  const lowStockCount = products.filter(p => !p.isDigital && p.stock <= p.lowStockThreshold).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Product Management</h1>
          <p className="mt-1 text-sm text-muted">Manage merchandise and educational products</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{products.length}</p>
              <p className="text-xs text-muted">Total Products</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{formatPrice(totalRevenue)}</p>
              <p className="text-xs text-muted">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{products.reduce((sum, p) => sum + p.salesCount, 0)}</p>
              <p className="text-xs text-muted">Total Sales</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-warning/10 p-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{lowStockCount}</p>
              <p className="text-xs text-muted">Low Stock Items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-base"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="input-base"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="discontinued">Discontinued</option>
        </select>
      </div>

      {/* Products List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-16 w-16 shrink-0 rounded-card" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="No products found"
            message="Add your first product to get started"
            action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add Product</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="hidden px-5 py-3 font-semibold md:table-cell">SKU</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">Category</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">Stock</th>
                  <th className="hidden px-5 py-3 font-semibold lg:table-cell">Sales</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((product) => {
                  const isLowStock = !product.isDigital && product.stock <= product.lowStockThreshold
                  return (
                    <tr key={product.id} className="group hover:bg-paper/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="h-16 w-16 shrink-0 rounded-card object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-card bg-paper">
                              <Package className="h-6 w-6 text-muted" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-ink">{product.name}</p>
                            <p className="mt-1 text-xs text-muted line-clamp-1">{product.description}</p>
                            {product.isDigital && (
                              <Badge color="brand" className="mt-1 text-xs">Digital</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-5 py-4 text-muted md:table-cell">
                        <code className="text-xs">{product.sku}</code>
                      </td>
                      <td className="hidden px-5 py-4 text-muted lg:table-cell">{product.category}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-ink">{formatPrice(product.price)}</p>
                        {product.costPrice && (
                          <p className="text-xs text-muted">Cost: {formatPrice(product.costPrice)}</p>
                        )}
                      </td>
                      <td className="hidden px-5 py-4 lg:table-cell">
                        {product.isDigital ? (
                          <span className="text-muted">∞</span>
                        ) : (
                          <span className={cn(
                            'font-medium',
                            isLowStock ? 'text-warning' : 'text-ink'
                          )}>
                            {product.stock}
                            {isLowStock && <AlertTriangle className="ml-1 inline h-3 w-3" />}
                          </span>
                        )}
                      </td>
                      <td className="hidden px-5 py-4 text-muted lg:table-cell">{product.salesCount}</td>
                      <td className="px-5 py-4">
                        <Badge color={STATUS_BADGE[product.status]}>
                          {product.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditing(product)}
                            className="rounded px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                            aria-label="Edit product"
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleting(product)}
                            className="rounded px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted">
            Showing {total === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} products
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <span className="text-xs text-muted">{page} / {totalPages}</span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(creating || editing) && (
        <ProductFormModal
          title={editing ? 'Edit Product' : 'Add Product'}
          product={editing || undefined}
          categories={categories}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSubmit={(data) => {
            toast('Success', `Product ${editing ? 'updated' : 'added'} successfully`)
            setCreating(false)
            setEditing(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Delete Product"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)} disabled={mutating}>
                Cancel
              </Button>
              <Button onClick={() => handleDelete(deleting)} disabled={mutating} className="text-danger">
                {mutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted">
            Are you sure you want to delete "{deleting.name}"? This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  )
}

function ProductFormModal({ title, product, categories, onClose, onSubmit }: {
  title: string
  product?: Product
  categories: string[]
  onClose: () => void
  onSubmit: (data: any) => void
}) {
  const [name, setName] = useState(product?.name || '')
  const [sku, setSku] = useState(product?.sku || '')
  const [description, setDescription] = useState(product?.description || '')
  const [category, setCategory] = useState(product?.category || categories[0])
  const [price, setPrice] = useState(product?.price?.toString() || '')
  const [costPrice, setCostPrice] = useState(product?.costPrice?.toString() || '')
  const [stock, setStock] = useState(product?.stock?.toString() || '0')
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.lowStockThreshold?.toString() || '10')
  const [isDigital, setIsDigital] = useState(product?.isDigital ?? false)
  const [status, setStatus] = useState<ProductStatus>(product?.status || 'available')

  const valid = name.trim().length > 0 && sku.trim().length > 0 && price.length > 0

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit({ name, sku, description, category, price: Number(price), costPrice: costPrice ? Number(costPrice) : undefined, stock: Number(stock), lowStockThreshold: Number(lowStockThreshold), isDigital, status })} disabled={!valid}>
            {product ? 'Save Changes' : <><Plus className="h-4 w-4" /> Add Product</>}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-base">Product Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Complete Anatomy Atlas"
            className="input-base"
            autoFocus
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">SKU</label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="BOOK-AA-001"
              className="input-base"
            />
          </div>
          <div>
            <label className="label-base">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-base">
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label-base">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Product description"
            className="input-base"
            rows={3}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base">Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="89.99"
              className="input-base"
            />
          </div>
          <div>
            <label className="label-base">Cost Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="45.00"
              className="input-base"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isDigital}
            onChange={(e) => setIsDigital(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-brand-500"
          />
          Digital product (no physical inventory)
        </label>
        {!isDigital && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-base">Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="100"
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">Low Stock Threshold</label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="10"
                className="input-base"
              />
            </div>
          </div>
        )}
        <div>
          <label className="label-base">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)} className="input-base">
            <option value="available">Available</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>
      </div>
    </Modal>
  )
}

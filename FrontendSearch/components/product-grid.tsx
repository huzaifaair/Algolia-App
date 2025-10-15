"use client"

import { Package } from "lucide-react"

interface Product {
  objectID: string
  productName?: string
  name?: string
  productImage?: string
  productImages?: string[]
  categoryPath?: string
  viewCount?: number
  _geoloc?: { lat: number; lng: number }
}

interface ProductGridProps {
  results: Product[]
  isLoading?: boolean
}

export default function ProductGrid({ results, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!results || results.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <Package className="mb-4 h-16 w-16 text-gray-300" />
        <p className="text-lg text-gray-500">No products found</p>
        <p className="text-sm text-gray-400">Try a different search term</p>
      </div>
    )
  }

  const renderProducts = (items: Product[]) => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const imgSrc =
          item.productImage ||
          (item.productImages && item.productImages.length > 0 ? item.productImages[0] : null)

        return (
          <div
            key={item.objectID}
            className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/10"
          >
            {/* Product Image */}
            <div className="flex h-48 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={item.productName || item.name || "Product"}
                  className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <Package className="h-16 w-16 text-blue-300" />
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="mb-2 text-lg font-bold text-blue-600 line-clamp-2">
                {item.productName || item.name || "Untitled Product"}
              </h3>
            </div>
          </div>
        )
      })}
    </div>
  )

  return <div className="space-y-10">{renderProducts(results)}</div>
}

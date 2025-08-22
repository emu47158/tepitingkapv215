import React, { useState } from 'react'
import { X, ShoppingCart, Plus, Minus, Star, Package, Truck, Shield } from 'lucide-react'

interface AddToCartPopupProps {
  onClose: () => void
  onItemAdded: () => void
}

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
  description: string
  category: string
  inStock: boolean
  fastDelivery: boolean
}

const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 299,
    originalPrice: 399,
    image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500',
    rating: 4.8,
    reviews: 1247,
    description: 'High-quality wireless headphones with noise cancellation and premium sound quality.',
    category: 'Electronics',
    inStock: true,
    fastDelivery: true
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    price: 199,
    originalPrice: 249,
    image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500',
    rating: 4.6,
    reviews: 892,
    description: 'Track your fitness goals with this advanced smartwatch featuring heart rate monitoring.',
    category: 'Wearables',
    inStock: true,
    fastDelivery: true
  },
  {
    id: '3',
    name: 'Organic Coffee Beans',
    price: 24,
    originalPrice: 32,
    image: 'https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=500',
    rating: 4.9,
    reviews: 456,
    description: 'Premium organic coffee beans sourced from sustainable farms around the world.',
    category: 'Food & Beverage',
    inStock: true,
    fastDelivery: false
  },
  {
    id: '4',
    name: 'Minimalist Desk Lamp',
    price: 89,
    originalPrice: 119,
    image: 'https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=500',
    rating: 4.7,
    reviews: 234,
    description: 'Modern LED desk lamp with adjustable brightness and sleek minimalist design.',
    category: 'Home & Office',
    inStock: true,
    fastDelivery: true
  },
  {
    id: '5',
    name: 'Eco-Friendly Water Bottle',
    price: 35,
    originalPrice: 45,
    image: 'https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?auto=compress&cs=tinysrgb&w=500',
    rating: 4.5,
    reviews: 678,
    description: 'Sustainable stainless steel water bottle that keeps drinks cold for 24 hours.',
    category: 'Lifestyle',
    inStock: true,
    fastDelivery: true
  },
  {
    id: '6',
    name: 'Wireless Phone Charger',
    price: 45,
    originalPrice: 60,
    image: 'https://images.pexels.com/photos/4526414/pexels-photo-4526414.jpeg?auto=compress&cs=tinysrgb&w=500',
    rating: 4.4,
    reviews: 321,
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
    category: 'Electronics',
    inStock: false,
    fastDelivery: false
  }
]

export function AddToCartPopup({ onClose, onItemAdded }: AddToCartPopupProps) {
  const [cart, setCart] = useState<{[productId: string]: number}>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const categories = ['All', ...Array.from(new Set(sampleProducts.map(p => p.category)))]

  const filteredProducts = selectedCategory === 'All' 
    ? sampleProducts 
    : sampleProducts.filter(p => p.category === selectedCategory)

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }))
    onItemAdded()
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[productId] > 1) {
        newCart[productId]--
      } else {
        delete newCart[productId]
      }
      return newCart
    })
  }

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = sampleProducts.find(p => p.id === productId)
      return total + (product ? product.price * quantity : 0)
    }, 0)
  }

  const getCartItemCount = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : i < rating 
            ? 'text-yellow-400 fill-current opacity-50' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
      <div className="backdrop-blur-xl bg-white/95 border border-white/30 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 sticky top-0 backdrop-blur-xl bg-white/95">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">SijangKu Marketplace</h2>
              <p className="text-sm text-gray-600">Discover amazing products</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {getCartItemCount() > 0 && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl">
                <ShoppingCart className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  {getCartItemCount()} items - ${getCartTotal()}
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="p-6 border-b border-white/20">
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-white/50 text-gray-700 hover:bg-white/70'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="backdrop-blur-xl bg-white/80 border border-white/30 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.originalPrice && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </div>
                  )}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold">Out of Stock</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-1 ml-2">
                      {renderStars(product.rating)}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Features */}
                  <div className="flex items-center space-x-3 mb-3">
                    {product.fastDelivery && (
                      <div className="flex items-center space-x-1">
                        <Truck className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Fast</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">Secure</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Package className="w-3 h-3 text-purple-600" />
                      <span className="text-xs text-purple-600 font-medium">Quality</span>
                    </div>
                  </div>

                  {/* Price and Rating */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-800">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-700">
                        {product.rating}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({product.reviews})
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart */}
                  <div className="flex items-center justify-between">
                    {cart[product.id] ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="w-8 h-8 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold text-gray-800 min-w-[20px] text-center">
                          {cart[product.id]}
                        </span>
                        <button
                          onClick={() => addToCart(product.id)}
                          disabled={!product.inStock}
                          className="w-8 h-8 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product.id)}
                        disabled={!product.inStock}
                        className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export const useCart = () => {
  const cartItems = useState<any[]>('cart_items', () => [])
  const wishlistItems = useState<any[]>('wishlist_items', () => [])
  const loading = useState('cart_loading', () => false)

  const cartCount = computed(() => cartItems.value.length)
  const wishlistCount = computed(() => wishlistItems.value.length)

  const fetchCartData = async () => {
    const saved = localStorage.getItem('user_info')
    if (!saved) {
      cartItems.value = []
      wishlistItems.value = []
      return
    }

    try {
      const user = JSON.parse(saved)
      const data = await $fetch('/api/cart/list', { params: { user_id: user.id } })
      cartItems.value = data.cart
      wishlistItems.value = data.wishlist
    } catch (e) {
      console.error('Failed to fetch cart data', e)
    }
  }

  return {
    cartItems,
    wishlistItems,
    cartCount,
    wishlistCount,
    fetchCartData,
    loading
  }
}

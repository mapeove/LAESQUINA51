// ============================================================
// LA ESQUINA 51 – Core Types
// ============================================================

// ---- Store Settings ----------------------------------------

export interface StoreSetting {
  id: string
  key: string
  value: string
  updated_at: string
}

// ---- Opening Hours -----------------------------------------

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0=Sun, 1=Mon … 6=Sat

export interface OpeningHour {
  id: string
  day_of_week: DayOfWeek
  open_time: string   // "HH:MM"
  close_time: string  // "HH:MM"
  active: boolean
}

export interface SpecialOpeningHour {
  id: string
  special_date: string // "YYYY-MM-DD"
  open_time: string
  close_time: string
  is_closed: boolean
  notes: string | null
  created_at: string
}

// ---- Delivery Zones ----------------------------------------

export interface DeliveryZone {
  id: string
  name: string
  postal_codes: string[]
  active: boolean
  delivery_fee: number
  min_order: number
}

// ---- Delivery Drivers --------------------------------------

export interface DeliveryDriver {
  id: string
  name: string
  phone: string
  vehicle_type: string
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

// ---- Campaigns ---------------------------------------------

export interface Campaign {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  media_type: 'IMAGE' | 'VIDEO'
  image_url: string | null
  video_url: string | null
  product_id: string | null
  promo_price: number | null
  button_text: string
  button_url: string
  active: boolean
  show_modal: boolean
  show_home: boolean
  show_menu: boolean
  start_date: string | null
  end_date: string | null
  priority: number
  display_frequency: 'ONCE_PER_SESSION' | 'ONCE_PER_DAY' | 'ALWAYS'
  created_at: string
  updated_at: string
  product?: Product
}

// ---- Categories --------------------------------------------

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  active: boolean
  sort_order: number
  created_at: string
}

// ---- Products ----------------------------------------------

export interface Product {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  short_description?: string | null
  price: number
  image: string | null
  image_url?: string | null
  video_url?: string | null
  active: boolean
  featured: boolean
  sort_order: number
  sold_out: boolean
  created_at: string
  updated_at: string
  category?: Category
  option_groups?: ProductOptionGroup[]
  extras?: ProductExtra[]
}

export interface ProductOptionGroup {
  id: string
  product_id: string
  name: string
  required: boolean
  sort_order: number
  options: ProductOption[]
}

export interface ProductOption {
  id: string
  group_id: string
  name: string
  price_modifier: number
  sort_order: number
}

export interface ProductExtra {
  id: string
  product_id: string
  name: string
  price: number
  active: boolean
}

// ---- Cart --------------------------------------------------

export interface CartItemOption {
  group_id: string
  group_name: string
  option_id: string
  option_name: string
  price_modifier: number
}

export interface CartItemExtra {
  extra_id: string
  extra_name: string
  price: number
}

export interface CartItem {
  cart_item_id: string
  product_id: string
  product_name: string
  product_price: number
  product_image: string | null
  quantity: number
  selected_options: CartItemOption[]
  selected_extras: CartItemExtra[]
  line_total: number
}

// ---- Orders ------------------------------------------------

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY: 'Listo',
  OUT_FOR_DELIVERY: 'En reparto',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-500 text-black',
  CONFIRMED: 'bg-blue-500 text-white',
  PREPARING: 'bg-orange-500 text-white',
  READY: 'bg-green-400 text-black',
  OUT_FOR_DELIVERY: 'bg-purple-500 text-white',
  DELIVERED: 'bg-green-600 text-white',
  CANCELLED: 'bg-red-600 text-white',
}

export interface OrderItemSnapshot {
  product_id: string
  product_name: string
  product_price: number
  quantity: number
  options: CartItemOption[]
  extras: CartItemExtra[]
  line_total: number
}

export interface Order {
  id: string
  order_number: string
  status: OrderStatus
  customer_name: string
  customer_phone: string
  customer_email: string | null
  delivery_address: string
  delivery_floor: string | null
  delivery_door: string | null
  delivery_zone_id: string | null
  delivery_zone_name: string | null
  subtotal: number
  delivery_fee: number
  total: number
  notes: string | null
  payment_method: 'CASH' | 'BIZUM' | string
  cash_change_for?: number | null
  driver_id?: string | null
  driver?: DeliveryDriver
  created_at: string
  updated_at: string
  items?: OrderItemSnapshot[]
}

// ---- Checkout Form -----------------------------------------

export interface CheckoutFormData {
  customer_name: string
  customer_phone: string
  customer_email: string
  delivery_address: string
  delivery_postal_code: string
  delivery_zone: string
  delivery_floor: string
  delivery_door: string
  notes: string
  payment_method: 'CASH' | 'BIZUM'
  cash_change_for?: string
}

// ---- Auth / Admin ------------------------------------------

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: string
  user_id: string
  role: 'OWNER' | 'admin' | 'staff'
  active: boolean
  created_at: string
}

// ---- Store State -------------------------------------------

export interface StoreState {
  is_open: boolean
  next_opening: string | null
  message: string | null
}

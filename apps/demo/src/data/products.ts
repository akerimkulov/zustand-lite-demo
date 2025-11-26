/**
 * Product data for E-commerce demo.
 */

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Беспроводные наушники',
    description: 'Премиальные беспроводные наушники с шумоподавлением и 30 часами автономной работы.',
    price: 299,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    category: 'Электроника',
  },
  {
    id: '2',
    name: 'Умные часы',
    description: 'Многофункциональные смарт-часы с отслеживанием здоровья и GPS.',
    price: 399,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    category: 'Электроника',
  },
  {
    id: '3',
    name: 'Подставка для ноутбука',
    description: 'Эргономичная алюминиевая подставка для правильной осанки.',
    price: 79,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop',
    category: 'Аксессуары',
  },
  {
    id: '4',
    name: 'Механическая клавиатура',
    description: 'RGB механическая клавиатура с переключателями Cherry MX.',
    price: 149,
    image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400&h=400&fit=crop',
    category: 'Электроника',
  },
  {
    id: '5',
    name: 'USB-C хаб',
    description: 'Хаб 7-в-1 с HDMI, SD-картой и портами USB 3.0.',
    price: 59,
    image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=400&fit=crop',
    category: 'Аксессуары',
  },
  {
    id: '6',
    name: 'Веб-камера HD',
    description: '1080p веб-камера с автофокусом и встроенным микрофоном.',
    price: 89,
    image: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400&h=400&fit=crop',
    category: 'Электроника',
  },
]

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category)
}

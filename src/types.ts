export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  stock: number;
  images: string[];
  sellerId: string;
  sellerName: string;
  isOfficial: boolean;
  rating: number;
  createdAt: any;
  isFeatured?: boolean;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  items: { productId: string; quantity: number; price: number }[];
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
  shippingAddress: string;
  paymentMethod: 'bkash' | 'nagad' | 'cod' | 'wallet' | 'card' | 'bank';
  paymentStatus: 'paid' | 'unpaid' | 'verifying';
  trxId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface DepositRequest {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    method: 'bkash' | 'nagad';
    trxId: string;
    status: 'verifying' | 'approved' | 'rejected';
    createdAt: any;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

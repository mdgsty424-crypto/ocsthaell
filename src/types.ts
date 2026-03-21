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
  userId: string;
  items: { id: string; quantity: number; price: number; name: string; image: string }[];
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    altPhone?: string;
    district: string;
    area: string;
    postCode?: string;
    detailedAddress: string;
  };
  trackingTimeline: { status: string; time: string; completed: boolean }[];
  deliveryLocation?: { lat: number; lng: number };
  createdAt: any;
}

export interface SellerProfile {
  uid: string;
  shopName: string;
  contactPerson: string;
  phone: string;
  pickupAddress: {
    area: string;
    detailedAddress: string;
    gps?: { lat: number; lng: number };
  };
  totalEarnings: number;
  totalSales: number;
  isVerified: boolean;
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

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
  origin?: {
    countryCode: string;
    countryName: string;
    flag: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  items: { id: string; quantity: number; price: number; name: string; image: string }[];
  total: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  trxId?: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    altPhone?: string;
    division: string;
    district: string;
    upazila: string;
    detailedAddress: string;
    addressType: 'Home' | 'Office';
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
    warehouseName: string;
    pointPersonName: string;
    pointPersonPhone: string;
    division: string;
    district: string;
    upazila: string;
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

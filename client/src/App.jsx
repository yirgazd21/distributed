import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';
// Buyer Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Seller Components
import SellerLayout from './components/seller/SellerLayout'; // 👈 NEW
import SellerRoute from './components/SellerRoute';
import SellerDashboardLayout from './components/seller/SellerDashboardLayout';

// Buyer Pages
import HomeScreen from './pages/HomeScreen';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import ResetPasswordScreen from './pages/ResetPasswordScreen';
import ProductDetailScreen from './pages/ProductDetailScreen';
import ProfileScreen from './pages/ProfileScreen';
import ShippingScreen from './pages/ShippingScreen';
import PaymentScreen from './pages/PaymentScreen';
import PlaceOrderScreen from './pages/PlaceOrderScreen';
import OrderScreen from './pages/OrderScreen';
import CartScreen from './pages/CartScreen';
import CategoryScreen from './pages/CategoryScreen';

// Seller Pages
import SellerLandingScreen from './pages/seller/SellerLandingScreen'; 
import SellerRegisterScreen from './pages/seller/SellerRegisterScreen';
import SellerLoginScreen from './pages/seller/SellerLoginScreen';
import SellerForgotPasswordScreen from './pages/seller/SellerForgotPasswordScreen';
import SellerResetPasswordScreen from './pages/seller/SellerResetPasswordScreen';
import SellerPendingScreen from './pages/seller/SellerPendingScreen';
import SellerDashboardScreen from './pages/seller/SellerDashboardScreen';
import SellerProductListScreen from './pages/seller/SellerProductListScreen';
import SellerProductEditScreen from './pages/seller/SellerProductEditScreen';
import SellerOrderListScreen from './pages/seller/SellerOrderListScreen';
import SellerOrderDetailsScreen from './pages/seller/SellerOrderDetailsScreen';
import SellerWalletScreen from './pages/seller/SellerWalletScreen';
import SellerSettingsScreen from './pages/seller/SellerSettingsScreen';
import SellerHelpCenterScreen from './pages/seller/SellerHelpCenterScreen';
import SellerRulesCenterScreen from './pages/seller/SellerRulesCenterScreen';
import SellerInboxScreen from './pages/seller/SellerInboxScreen';

// Admin Pages
import AdminLoginScreen from './admin/pages/AdminLoginScreen';
import AdminForgotPasswordScreen from './admin/pages/AdminForgotPasswordScreen';
import AdminResetPasswordScreen from './admin/pages/AdminResetPasswordScreen';
import AdminDashboardScreen from './admin/pages/AdminDashboardScreen';
import AdminSellerReviewScreen from './admin/pages/AdminSellerReviewScreen';
import AdminSellerDetailsScreen from './admin/pages/AdminSellerDetailsScreen';
import AdminUserManagementScreen from './admin/pages/AdminUserManagementScreen';
import AdminOrdersDisputesScreen from './admin/pages/AdminOrdersDisputesScreen';
import AdminFinanceScreen from './admin/pages/AdminFinanceScreen';
import AdminSupportDeskScreen from './admin/pages/AdminSupportDeskScreen';
import AdminSystemSettingsScreen from './admin/pages/AdminSystemSettingsScreen';
import AdminRouteGuard from './admin/components/AdminRoute';
import { useTheme } from './context/ThemeContext';
import OrderSuccessScreen from './pages/OrderSuccessScreen';

const RouteScopeSync = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    let scope = 'buyer';
    if (pathname.startsWith('/admin')) {
      scope = 'admin';
    } else if (pathname.startsWith('/seller') || pathname === '/sell') {
      scope = 'seller';
    }

    document.documentElement.setAttribute('data-scope', scope);
  }, [pathname]);

  return null;
};

// Connects the React client directly to its companion peer backend server instance
const socket = io('http://localhost:3000', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

const App = () => {
  const { theme } = useTheme();

  useEffect(() => {
    // Listen for live peer updates on products
    socket.on('peer-product-added', (newProduct) => {
      console.log('Real-time synchronization data package received:', newProduct);
      
      // Instantly alert the current screen user with toast notification
      if (typeof window !== 'undefined') {
        // You can import 'toast' from react-toastify if you want to use it here
        // toast.info(`New product synchronized: ${newProduct.name || 'Market item'}`);
      }
    });

    // Listen for live peer updates on orders
    socket.on('peer-order-placed', (newOrder) => {
      console.log('Real-time peer network order synchronization:', newOrder);
    });

    return () => {
      socket.off('peer-product-added');
      socket.off('peer-order-placed');
    };
  }, []);

  return (
    <Router>
      <RouteScopeSync />
      <Routes>
        
        {/* =======================================
            🛍️ BUYER ROUTES (Uses standard Layout) 
            ======================================= */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomeScreen />} index />
          <Route path="/search/:keyword" element={<HomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/reset-password/:token" element={<ResetPasswordScreen />} />
          <Route path="/product/:id" element={<ProductDetailScreen />} />

          {/* 🔒 Buyer Routes after login */}
          <Route path="" element={<PrivateRoute />}>
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/shipping" element={<ShippingScreen />} />
            <Route path="/payment" element={<PaymentScreen />} />
            <Route path="/placeorder" element={<PlaceOrderScreen />} />
            <Route path="/order/:id" element={<OrderScreen />} />
            <Route path="/order-success" element={<OrderSuccessScreen />} />
            <Route path="/cart" element={<CartScreen />} />
            <Route path="/category/:categoryName" element={<CategoryScreen />} />
            <Route path="/category/:categoryName/:subcategoryName" element={<CategoryScreen />} />
          </Route>

        </Route>


        {/* =======================================
            🏪 SELLER ROUTES (Uses SellerLayout) 
            ======================================= */}
        <Route element={<SellerLayout />}>
          <Route path="/sell" element={<SellerLandingScreen />} />
          <Route path="/seller/register" element={<SellerRegisterScreen />} />
          <Route path="/seller/login" element={<SellerLoginScreen />} />
          <Route path="/seller/forgot-password" element={<SellerForgotPasswordScreen />} />
          <Route path="/seller/reset-password/:token" element={<SellerResetPasswordScreen />} />
          <Route path="/seller/pending" element={<SellerPendingScreen />} />
          <Route path="/seller/help-center" element={<SellerHelpCenterScreen />} />
          <Route path="/seller/rules-center" element={<SellerRulesCenterScreen />} />
        </Route>

        {/* =======================================
            💼 APPROVED SELLER WORKSPACE ROUTES 
            ======================================= */}
        <Route element={<SellerDashboardLayout />}>
          <Route path="" element={<SellerRoute />}>
          <Route path="/seller/dashboard" element={<SellerDashboardScreen />} />
          <Route path="/seller/products" element={<SellerProductListScreen />} />
          <Route path="/seller/products/add" element={<SellerProductEditScreen />} />
          <Route path="/seller/products/:id/edit" element={<SellerProductEditScreen />} />
          <Route path="/seller/orders" element={<SellerOrderListScreen />} />
          <Route path="/seller/order/:id" element={<SellerOrderDetailsScreen />} />
          <Route path="/seller/wallet" element={<SellerWalletScreen />} />
          <Route path="/seller/inbox" element={<SellerInboxScreen />} />
          <Route path="/seller/settings" element={<SellerSettingsScreen />} />
          </Route>
        </Route>

        {/* =======================================
            🛡️ ADMIN ROUTES
            ======================================= */}
        <Route path="/admin/login" element={<AdminLoginScreen />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPasswordScreen />} />
        <Route path="/admin/reset-password/:token" element={<AdminResetPasswordScreen />} />
        <Route element={<AdminRouteGuard />}>
          <Route path="/admin/dashboard" element={<AdminDashboardScreen />} />
          <Route path="/admin/sellers" element={<AdminSellerReviewScreen />} />
          <Route path="/admin/sellers/:id" element={<AdminSellerDetailsScreen />} />
          <Route path="/admin/users" element={<AdminUserManagementScreen />} />
          <Route path="/admin/disputes" element={<AdminOrdersDisputesScreen />} />
          <Route path="/admin/finance" element={<AdminFinanceScreen />} />
          <Route path="/admin/support" element={<AdminSupportDeskScreen />} />
          <Route path="/admin/settings" element={<AdminSystemSettingsScreen />} />
        </Route>

      </Routes>
      <ToastContainer position="top-right" autoClose={3000} theme={theme} />
    </Router>
  );
};

export default App;

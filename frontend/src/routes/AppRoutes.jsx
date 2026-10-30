import { Routes as RouterRoutes, Route as RouterRoute } from 'react-router-dom';

// Layouts
import CustomerLayout from '../layouts/CustomerLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages - Guest & Customer & Auth
import Home from '../pages/guest/Home';
import Menu from '../pages/guest/Menu';
import News from '../pages/guest/News';
import RestaurantLayout from '../pages/guest/RestaurantLayout';
import CustomerHome from '../pages/customer/CustomerHome';
import MyReservations from '../pages/customer/MyReservations';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Pages - Profile & Operations
import Profile from '../pages/profile/Profile';
import AccountManagement from '../pages/manager/AccountManagement';
import TableLayout from '../pages/manager/TableLayout';
import ReservationManagement from '../pages/reservation/ReservationManagement';
import OrderManagement from '../pages/order/OrderManagement';
import OrderHistory from '../pages/order/OrderHistory';
import CompleteServing from '../pages/order/CompleteServing';
import KitchenDisplay from '../pages/kitchen/KitchenDisplay';
import BillingPayment from '../pages/billing/BillingPayment';
import PromotionManagement from '../pages/promotion/PromotionManagement';
import EmployeeScheduleManagement from '../pages/employee/EmployeeScheduleManagement';
import ShiftManagement from '../pages/employee/ShiftManagement';
import AnalyticsDashboard from '../pages/dashboard/AnalyticsDashboard';
import FeedbackManagement from '../pages/feedback/FeedbackManagement';
import BannerManagement from '../pages/manager/BannerManagement';
import NewsManagement from '../pages/manager/NewsManagement';
import DailyInventoryManagement from '../pages/manager/DailyInventoryManagement';

export default function AppRoutes() {
    return (
        <RouterRoutes>
            {/* Portal Khách vãng lai & Khách hàng */}
            <RouterRoute path="/" element={<CustomerLayout />}>
                <RouterRoute index element={<Home />} />
                <RouterRoute path="menu" element={<Menu />} />
                <RouterRoute path="news" element={<News />} />
                <RouterRoute path="restaurant-info" element={<News />} />
                <RouterRoute path="restaurant-layout" element={<RestaurantLayout />} />
                <RouterRoute path="customer-home" element={<CustomerHome />} />
                <RouterRoute path="profile" element={<Profile />} />
                <RouterRoute path="my-reservations" element={<MyReservations />} />
                <RouterRoute path="reservations" element={<ReservationManagement />} />
                <RouterRoute path="feedback" element={<FeedbackManagement />} />
            </RouterRoute>

            {/* Auth */}
            <RouterRoute path="/login" element={<Login />} />
            <RouterRoute path="/register" element={<Register />} />
            <RouterRoute path="/forgot-password" element={<ForgotPassword />} />

            {/* Standalone Stations */}
            <RouterRoute path="/staff" element={<OrderManagement />} />
            <RouterRoute path="/kitchen" element={<KitchenDisplay />} />

            {/* Phân hệ Quản trị & Vận hành (Staff, Kitchen, Manager, Owner) */}
            <RouterRoute path="/dashboard" element={<DashboardLayout />}>
                <RouterRoute index element={<AnalyticsDashboard />} />
                <RouterRoute path="profile" element={<Profile />} />
                <RouterRoute path="daily-inventory" element={<DailyInventoryManagement />} />
                <RouterRoute path="accounts" element={<AccountManagement />} />
                <RouterRoute path="tables" element={<TableLayout />} />
                <RouterRoute path="menu" element={<Menu />} />
                <RouterRoute path="reservations" element={<ReservationManagement />} />
                <RouterRoute path="orders" element={<OrderManagement />} />
                <RouterRoute path="order-history" element={<OrderHistory />} />
                <RouterRoute path="serving" element={<CompleteServing />} />
                <RouterRoute path="kitchen" element={<KitchenDisplay />} />
                <RouterRoute path="billing" element={<BillingPayment />} />
                <RouterRoute path="promotions" element={<PromotionManagement />} />
                <RouterRoute path="employees" element={<EmployeeScheduleManagement />} />
                <RouterRoute path="shifts" element={<ShiftManagement />} />
                <RouterRoute path="analytics" element={<AnalyticsDashboard />} />
                <RouterRoute path="feedback" element={<FeedbackManagement />} />
                <RouterRoute path="banners" element={<BannerManagement />} />
                <RouterRoute path="news" element={<NewsManagement />} />
            </RouterRoute>
        </RouterRoutes>
    );
}
import { Routes as RouterRoutes, Route as RouterRoute } from 'react-router-dom';

// Layouts
import CustomerLayout from '../layouts/CustomerLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages - Guest & Customer & Auth
import Home from '../pages/guest/Home';
import Menu from '../pages/guest/Menu';
import RestaurantInfo from '../pages/guest/RestaurantInfo';
import RestaurantLayout from '../pages/guest/RestaurantLayout';
import CustomerHome from '../pages/customer/CustomerHome';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Pages - Profile & Operations
import Profile from '../pages/profile/Profile';
import AccountManagement from '../pages/manager/AccountManagement';
import TableLayout from '../pages/manager/TableLayout';
import ReservationManagement from '../pages/reservation/ReservationManagement';
import OrderManagement from '../pages/order/OrderManagement';
import KitchenDisplay from '../pages/kitchen/KitchenDisplay';
import BillingPayment from '../pages/billing/BillingPayment';
import PromotionManagement from '../pages/promotion/PromotionManagement';
import EmployeeScheduleManagement from '../pages/employee/EmployeeScheduleManagement';
import AnalyticsDashboard from '../pages/dashboard/AnalyticsDashboard';
import FeedbackManagement from '../pages/feedback/FeedbackManagement';

export default function AppRoutes() {
    return (
        <RouterRoutes>
            {/* Portal Khách vãng lai & Khách hàng */}
            <RouterRoute path="/" element={<CustomerLayout />}>
                <RouterRoute index element={<Home />} />
                <RouterRoute path="menu" element={<Menu />} />
                <RouterRoute path="restaurant-info" element={<RestaurantInfo />} />
                <RouterRoute path="restaurant-layout" element={<RestaurantLayout />} />
                <RouterRoute path="customer-home" element={<CustomerHome />} />
                <RouterRoute path="profile" element={<Profile />} />
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
                <RouterRoute path="accounts" element={<AccountManagement />} />
                <RouterRoute path="tables" element={<TableLayout />} />
                <RouterRoute path="menu" element={<Menu />} />
                <RouterRoute path="reservations" element={<ReservationManagement />} />
                <RouterRoute path="orders" element={<OrderManagement />} />
                <RouterRoute path="kitchen" element={<KitchenDisplay />} />
                <RouterRoute path="billing" element={<BillingPayment />} />
                <RouterRoute path="promotions" element={<PromotionManagement />} />
                <RouterRoute path="employees" element={<EmployeeScheduleManagement />} />
                <RouterRoute path="analytics" element={<AnalyticsDashboard />} />
                <RouterRoute path="feedback" element={<FeedbackManagement />} />
            </RouterRoute>
        </RouterRoutes>
    );
}
import { createContext, useContext, useState, useEffect } from 'react';
import customerAvatar from '../assets/avartar/customer.jpg';
import staffAvatar from '../assets/avartar/staff.jpg';
import chefAvatar from '../assets/avartar/chef.jpeg';
import ownAvatar from '../assets/avartar/own.jpg';

const AuthContext = createContext();

// Mock User Database for Full Authentication Flow
export const MOCK_ACCOUNTS_DB = [
    {
        id: 'USR-101',
        role: 'Customer',
        name: 'Nguyen Thi Thanh Thao',
        email: 'nguyenthithanhthao2018vl@gmail.com',
        phone: '0901 234 567',
        avatar: customerAvatar,
        joinDate: '2026-01-15',
        address: 'Ninh Kieu, Can Tho City',
        gender: 'Female',
        dob: '2002-05-18',
        status: 'Active',
    },
    {
        id: 'STAFF-201',
        role: 'Staff',
        name: 'Tran Van Minh',
        email: 'minhtran.staff@lumiere.com',
        phone: '0912 888 999',
        avatar: staffAvatar,
        joinDate: '2025-08-10',
        address: 'Cai Rang, Can Tho City',
        gender: 'Male',
        dob: '1998-11-20',
        status: 'Active',
    },
    {
        id: 'CHEF-301',
        role: 'Kitchen',
        name: 'Master Chef Le Hoang',
        email: 'hoangle.chef@lumiere.com',
        phone: '0988 555 333',
        avatar: chefAvatar,
        joinDate: '2024-03-01',
        address: 'Binh Thuy, Can Tho City',
        gender: 'Male',
        dob: '1985-04-12',
        status: 'Active',
    },
    {
        id: 'MGR-401',
        role: 'Manager',
        name: 'Pham Quoc Bao',
        email: 'baopham.manager@lumiere.com',
        phone: '0909 777 666',
        avatar: ownAvatar,
        joinDate: '2024-01-01',
        address: 'Phong Dien, Can Tho City',
        gender: 'Male',
        dob: '1990-09-09',
        status: 'Active',
    },
    {
        id: 'OWN-501',
        role: 'Owner',
        name: 'Madam Lumière',
        email: 'owner@lumiere.com',
        phone: '0999 999 999',
        avatar: ownAvatar,
        joinDate: '2023-12-01',
        address: 'District 1, Ho Chi Minh City',
        gender: 'Female',
        dob: '1988-02-14',
        status: 'Active',
    },
];

export function AuthProvider({ children }) {
    // Initial user from localStorage or null
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('lumiere_auth_user');
        return saved ? JSON.parse(saved) : MOCK_ACCOUNTS_DB[0]; // Default logged in as Customer
    });

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('lumiere_auth_user', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('lumiere_auth_user');
        }
    }, [currentUser]);

    // Login
    const login = (email) => {
        const found = MOCK_ACCOUNTS_DB.find(
            (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        const targetUser = found || {
            id: `USR-${Math.floor(100 + Math.random() * 900)}`,
            role: 'Customer',
            name: email.split('@')[0],
            email: email,
            phone: '0900 000 000',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
            joinDate: new Date().toISOString().split('T')[0],
            address: 'Can Tho City',
            gender: 'Other',
            dob: '2000-01-01',
            status: 'Active',
        };

        setCurrentUser(targetUser);
        return targetUser;
    };

    // Logout
    const logout = () => {
        setCurrentUser(null);
    };

    // Update Profile
    const updateProfile = (updatedFields) => {
        if (!currentUser) return;
        const newObj = { ...currentUser, ...updatedFields };
        setCurrentUser(newObj);
    };

    return (
        <AuthContext.Provider value={{ currentUser, setCurrentUser, login, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

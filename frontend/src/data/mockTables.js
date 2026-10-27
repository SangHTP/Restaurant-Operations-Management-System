// Table Status Types (4 Core Statuses)
export const TABLE_STATUSES = {
    AVAILABLE: 'Available',
    OCCUPIED: 'Occupied',
    RESERVED: 'Reserved',
    CLEANING: 'Cleaning',
};

export const STATUS_STYLES = {
    Available:    { bg: 'bg-emerald-500',   border: 'border-emerald-400',  text: 'text-emerald-700',   light: 'bg-emerald-50',  dot: '🟢' },
    Occupied:     { bg: 'bg-rose-500',      border: 'border-rose-400',     text: 'text-rose-700',      light: 'bg-rose-50',     dot: '🔴' },
    Reserved:     { bg: 'bg-amber-500',     border: 'border-amber-400',    text: 'text-amber-700',     light: 'bg-amber-50',    dot: '🟡' },
    Cleaning:     { bg: 'bg-sky-400',       border: 'border-sky-300',      text: 'text-sky-700',       light: 'bg-sky-50',      dot: '🔵' },
};

export const INITIAL_AREAS = [
    { id: 'area-1', name: 'Grand Hall',       description: 'Main indoor fine dining area',    capacity: 80, color: '#0b132b', icon: '🏛️' },
    { id: 'area-2', name: 'Rooftop Terrace',  description: 'Alfresco sky dining with views',  capacity: 40, color: '#1a3a2a', icon: '🌿' },
    { id: 'area-3', name: 'VIP Lounge',       description: 'Exclusive private dining rooms',   capacity: 30, color: '#2a1a3a', icon: '👑' },
    { id: 'area-4', name: 'Garden Pavilion',  description: 'Open-air garden setting',         capacity: 50, color: '#1a2a3a', icon: '🌺' },
];

export const INITIAL_TABLES = [
    // Grand Hall
    { id: 'T01', areaId: 'area-1', name: 'T01', seats: 2,  x: 8,  y: 10, status: 'Available',  guest: null, note: '' },
    { id: 'T02', areaId: 'area-1', name: 'T02', seats: 4,  x: 22, y: 10, status: 'Occupied',   guest: 'Nguyen Fam', note: 'Wine pairing ordered' },
    { id: 'T03', areaId: 'area-1', name: 'T03', seats: 4,  x: 36, y: 10, status: 'Reserved',   guest: 'Tran Corp', note: 'Arrives 7:30 PM' },
    { id: 'T04', areaId: 'area-1', name: 'T04', seats: 6,  x: 50, y: 10, status: 'Available',  guest: null, note: '' },
    { id: 'T05', areaId: 'area-1', name: 'T05', seats: 6,  x: 64, y: 10, status: 'Cleaning',   guest: null, note: 'Post-event cleanup' },
    { id: 'T06', areaId: 'area-1', name: 'T06', seats: 2,  x: 8,  y: 40, status: 'Occupied',   guest: 'Le & Hoang', note: 'Anniversary dinner' },
    { id: 'T07', areaId: 'area-1', name: 'T07', seats: 8,  x: 22, y: 40, status: 'Available',  guest: null, note: '' },
    { id: 'T08', areaId: 'area-1', name: 'T08', seats: 8,  x: 36, y: 40, status: 'Available',  guest: null, note: '' },
    { id: 'T09', areaId: 'area-1', name: 'T09', seats: 4,  x: 50, y: 40, status: 'Available',  guest: null, note: '' },
    { id: 'T10', areaId: 'area-1', name: 'T10', seats: 4,  x: 64, y: 40, status: 'Reserved',   guest: 'Mr. Smith', note: 'Business dinner, 8 PM' },

    // Rooftop Terrace
    { id: 'T11', areaId: 'area-2', name: 'T11', seats: 2,  x: 8,  y: 10, status: 'Available',  guest: null, note: '' },
    { id: 'T12', areaId: 'area-2', name: 'T12', seats: 2,  x: 22, y: 10, status: 'Occupied',   guest: 'Couple B', note: 'Champagne ordered' },
    { id: 'T13', areaId: 'area-2', name: 'T13', seats: 4,  x: 36, y: 10, status: 'Available',  guest: null, note: '' },
    { id: 'T14', areaId: 'area-2', name: 'T14', seats: 4,  x: 8,  y: 42, status: 'Reserved',   guest: 'Pham Fam', note: '' },
    { id: 'T15', areaId: 'area-2', name: 'T15', seats: 6,  x: 22, y: 42, status: 'Cleaning',   guest: null, note: '' },

    // VIP Lounge
    { id: 'T16', areaId: 'area-3', name: 'VIP-A', seats: 8,  x: 8,  y: 15, status: 'Available',  guest: null, note: '' },
    { id: 'T17', areaId: 'area-3', name: 'VIP-B', seats: 10, x: 45, y: 15, status: 'Occupied',   guest: 'CEO Summit', note: 'Private event until 11PM' },
    { id: 'T18', areaId: 'area-3', name: 'VIP-C', seats: 12, x: 8,  y: 52, status: 'Reserved',   guest: 'Royal Suite', note: '' },

    // Garden Pavilion
    { id: 'T19', areaId: 'area-4', name: 'G01', seats: 4,  x: 8,  y: 10, status: 'Available',  guest: null, note: '' },
    { id: 'T20', areaId: 'area-4', name: 'G02', seats: 4,  x: 28, y: 10, status: 'Occupied',   guest: 'Bao Family', note: '' },
    { id: 'T21', areaId: 'area-4', name: 'G03', seats: 6,  x: 48, y: 10, status: 'Available',  guest: null, note: '' },
    { id: 'T22', areaId: 'area-4', name: 'G04', seats: 6,  x: 68, y: 10, status: 'Cleaning',   guest: null, note: '' },
    { id: 'T23', areaId: 'area-4', name: 'G05', seats: 8,  x: 28, y: 50, status: 'Reserved',   guest: 'Wedding Party', note: 'Full garden row booked' },
];

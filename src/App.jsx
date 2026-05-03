import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';

// Layouts
import SuperAdminLayout from './layouts/SuperAdminLayout';
import AdminCabangLayout from './layouts/AdminCabangLayout';
import KaryawanLayout from './layouts/KaryawanLayout';

// Super Admin Pages
import SADashboard from './pages/SuperAdmin/SADashboard';
import SACabang from './pages/SuperAdmin/SACabang';
import SAKaryawan from './pages/SuperAdmin/SAKaryawan';
import SAShift from './pages/SuperAdmin/SAShift';
import SALaporan from './pages/SuperAdmin/SALaporan';
import SAAdmin from './pages/SuperAdmin/SAAdmin';
import SAPengaturan from './pages/SuperAdmin/SAPengaturan';

import ACDashboard from './pages/AdminCabang/ACDashboard';
import ACKaryawan from './pages/AdminCabang/ACKaryawan';
import ACAbsensiHariIni from './pages/AdminCabang/ACAbsensiHariIni';
import ACShift from './pages/AdminCabang/ACShift';
import ACProfil from './pages/AdminCabang/ACProfil';
import ACLaporan from './pages/AdminCabang/ACLaporan';
import KaryawanDashboard from './pages/Karyawan/KaryawanDashboard';
import KaryawanAbsen from './pages/Karyawan/KaryawanAbsen';
import KaryawanRiwayat from './pages/Karyawan/KaryawanRiwayat';
import KaryawanIzin from './pages/Karyawan/KaryawanIzin';
import KaryawanProfil from './pages/Karyawan/KaryawanProfil';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Super Admin Routes */}
        <Route path="/superadmin" element={<SuperAdminLayout />}>
          <Route index element={<SADashboard />} />
          <Route path="cabang" element={<SACabang />} />
          <Route path="karyawan" element={<SAKaryawan />} />
          <Route path="shift" element={<SAShift />} />
          <Route path="laporan" element={<SALaporan />} />
          <Route path="admin" element={<SAAdmin />} />
          <Route path="pengaturan" element={<SAPengaturan />} />
        </Route>

        {/* Admin Cabang Routes */}
        <Route path="/admin" element={<AdminCabangLayout />}>
          <Route index element={<ACDashboard />} />
          <Route path="karyawan" element={<ACKaryawan />} />
          <Route path="absensi-hari-ini" element={<ACAbsensiHariIni />} />
          <Route path="laporan" element={<ACLaporan />} />
          <Route path="shift" element={<ACShift />} />
          <Route path="profil" element={<ACProfil />} />
        </Route>

        {/* Karyawan Routes */}
        <Route path="/karyawan" element={<KaryawanLayout />}>
          <Route index element={<KaryawanDashboard />} />
          <Route path="absen" element={<KaryawanAbsen />} />
          <Route path="riwayat" element={<KaryawanRiwayat />} />
          <Route path="izin" element={<KaryawanIzin />} />
          <Route path="profil" element={<KaryawanProfil />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

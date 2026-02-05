import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DndWrapper } from './components/DndWrapper';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/pages/Dashboard';
import { QuanLyBU } from './components/pages/QuanLyBU';
import { QuanLyThuChi } from './components/pages/QuanLyThuChi';
import { QuanLyNhanSu } from './components/pages/QuanLyNhanSu';
import { QuanLyDoiTac } from './components/pages/QuanLyDoiTac';
import { QuanLyNguoiDung } from './components/pages/QuanTriHeThong/QuanLyNguoiDung';
import { PhanQuyenVaiTro } from './components/pages/QuanTriHeThong/PhanQuyenVaiTro';
import { ThietLapBaoMat } from './components/pages/admin/ThietLapBaoMat';
import { NhatKyHeThong } from './components/pages/admin/NhatKyHeThong';
import { AuditLog } from './components/pages/admin/AuditLog';
import { DanhMucThuChi } from './components/pages/master/DanhMucThuChi';
import { PhanBoChiPhi } from './components/pages/master/PhanBoChiPhi';
import { QuanLyDuAn } from './components/pages/master/QuanLyDuAn';
import { CapBacNhanSu } from './components/pages/master/CapBacNhanSu';
import { ChuyenMonVaiTro } from './components/pages/master/ChuyenMonVaiTro';
import { PhuongThucThanhToan } from './components/pages/master/PhuongThucThanhToan';
import { ProfilePage } from './components/pages/ProfilePage';
import { ChangePasswordPage } from './components/pages/ChangePasswordPage';
import { DocumentViewer } from './components/pages/DocumentViewer';

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}>
        <Header sidebarCollapsed={sidebarCollapsed} />
        <div className="pt-16">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/quan-ly-bu" element={<QuanLyBU />} />
            <Route path="/quan-ly-thu-chi" element={<QuanLyThuChi />} />
            <Route path="/quan-ly-nhan-su" element={<QuanLyNhanSu />} />
            <Route path="/quan-ly-doi-tac" element={<QuanLyDoiTac />} />

            {/* Admin Routes */}
            <Route path="/admin/nguoi-dung" element={<QuanLyNguoiDung />} />
            <Route path="/admin/phan-quyen" element={<PhanQuyenVaiTro />} />
            <Route path="/admin/bao-mat" element={<ThietLapBaoMat />} />
            <Route path="/admin/nhat-ky" element={<NhatKyHeThong />} />
            <Route path="/admin/audit-logs" element={<AuditLog />} />

            {/* Master Data Routes */}
            <Route path="/master/danh-muc" element={<DanhMucThuChi />} />
            <Route path="/master/phan-bo-chi-phi" element={<PhanBoChiPhi />} />
            <Route path="/master/du-an" element={<QuanLyDuAn />} />
            <Route path="/master/cap-bac" element={<CapBacNhanSu />} />
            <Route path="/master/chuyen-mon" element={<ChuyenMonVaiTro />} />
            <Route path="/master/thanh-toan" element={<PhuongThucThanhToan />} />

            {/* User Profile Routes */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <TransactionProvider>
          <DndWrapper>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Document Viewer - Public access for opening in new tabs */}
                <Route path="/document-viewer" element={<DocumentViewer />} />

                {/* Protected Routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </DndWrapper>
        </TransactionProvider>
      </AppProvider>
    </AuthProvider>
  );
}

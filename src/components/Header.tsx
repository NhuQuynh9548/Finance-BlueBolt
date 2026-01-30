import React, { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown, User, Lock, LogOut, Building2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, Notification } from '../services/notificationService';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const navigate = useNavigate();
  const { currentUser, selectedBU, setSelectedBU, availableBUs, canSelectBU } = useApp();
  const { logout } = useAuth();

  const [showBUDropdown, setShowBUDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [realNotifications, setRealNotifications] = useState<Notification[]>([]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setRealNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      // Poll for notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Get current BU display
  const currentBU = availableBUs.find(bu => bu.id === selectedBU);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mock notifications removed
  // const notifications = [
  //   { id: 1, message: 'Phiếu chi #001 chờ duyệt', time: '5 phút trước', unread: true },
  //   { id: 2, message: 'Phiếu thu #025 đã được duyệt', time: '1 giờ trước', unread: true },
  //   { id: 3, message: 'Phiếu chi #002 bị từ chối', time: '2 giờ trước', unread: false },
  // ];

  const unreadCount = realNotifications.filter(n => n.unread).length;

  return (
    <header className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-40 transition-all duration-300 ${sidebarCollapsed ? 'left-20' : 'left-64'
      }`}>
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Left Section - BU Selector & Search */}
        <div className="flex items-center gap-4 flex-1">
          {/* BU Selector */}
          <div className="relative">
            <button
              onClick={() => canSelectBU && setShowBUDropdown(!showBUDropdown)}
              disabled={!canSelectBU}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white transition-all ${canSelectBU
                ? 'hover:border-[#004aad] hover:bg-blue-50 cursor-pointer'
                : 'opacity-60 cursor-not-allowed bg-gray-50'
                }`}
              title={!canSelectBU ? `Bạn chỉ có quyền xem ${currentBU?.name}` : ''}
            >
              <Building2 className="w-4 h-4 text-[#004aad]" />
              <span className="font-medium text-gray-700 whitespace-nowrap">
                {currentBU?.name || 'Chọn BU'}
              </span>
              {canSelectBU && <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {/* User role badge */}
            {!canSelectBU && (
              <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-semibold">
                {currentUser.role}
              </div>
            )}

            {/* BU Dropdown Menu */}
            {showBUDropdown && canSelectBU && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowBUDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  {availableBUs.map((bu) => (
                    <button
                      key={bu.id}
                      onClick={() => {
                        setSelectedBU(bu.id);
                        setShowBUDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors ${selectedBU === bu.id ? 'bg-blue-50 text-[#004aad] font-medium' : 'text-gray-700'
                        }`}
                    >
                      {bu.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm phiếu thu/chi, đối tác, nhân sự..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Right Section - Notifications & User Account */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-[#F7931E] text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Thông báo</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {realNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <p className="text-sm">Không có thông báo nào</p>
                      </div>
                    ) : (
                      realNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (notif.unread) handleMarkAsRead(notif.id);
                            if (notif.relatedId) {
                              // Always navigate to absolute path with highlight parameter
                              // Add timestamp to force navigation even when already on the page
                              navigate(`/quan-ly-thu-chi?highlight=${notif.relatedId}&t=${Date.now()}`);
                              setShowNotifications(false);
                            }
                          }}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${notif.unread ? 'bg-blue-50' : ''
                            }`}
                        >
                          <p className={`text-sm ${notif.unread ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notif.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-200 text-center">
                    <button
                      onClick={handleMarkAllRead}
                      className="text-sm text-[#004aad] hover:underline font-medium"
                    >
                      Đánh dấu tất cả là đã đọc
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Account */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 bg-[#004aad] rounded-full flex items-center justify-center text-white font-semibold">
                {currentUser.name.split(' ').slice(0)[0].charAt(0).toUpperCase()}
                {/* {currentUser.name.charAt(0).toUpperCase()} */}
              </div>
              {/* User Info */}
              <div className="text-left hidden lg:block">
                <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 hidden lg:block" />
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="font-semibold text-gray-800">{currentUser.name}</p>
                    <p className="text-sm text-gray-500">{currentUser.role}</p>
                    {currentUser.buName && (
                      <p className="text-xs text-[#004aad] mt-1">{currentUser.buName}</p>
                    )}
                  </div>
                  <Link
                    to="/profile"
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Thông tin cá nhân</span>
                  </Link>
                  <Link
                    to="/change-password"
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Đổi mật khẩu</span>
                  </Link>
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-red-600" onClick={handleLogout}>
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

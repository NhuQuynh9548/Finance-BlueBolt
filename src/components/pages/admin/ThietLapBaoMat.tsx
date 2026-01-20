import React, { useState, useEffect } from 'react';
import { Lock, Shield, Key, Clock, AlertTriangle, Check, Eye, EyeOff, Smartphone, Loader2, Save } from 'lucide-react';
import settingService from '../../../services/settingService';
import { toast } from 'sonner';

export function ThietLapBaoMat() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [passwordExpiry, setPasswordExpiry] = useState(90);
  const [loginAttempts, setLoginAttempts] = useState(5);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingService.getAll();
      if (data.twoFactorEnabled !== undefined) setTwoFactorEnabled(data.twoFactorEnabled === 'true');
      if (data.sessionTimeout !== undefined) setSessionTimeout(Number(data.sessionTimeout));
      if (data.passwordExpiry !== undefined) setPasswordExpiry(Number(data.passwordExpiry));
      if (data.loginAttempts !== undefined) setLoginAttempts(Number(data.loginAttempts));
    } catch (error) {
      console.error('Fetch settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingService.update({
        twoFactorEnabled: String(twoFactorEnabled),
        sessionTimeout: String(sessionTimeout),
        passwordExpiry: String(passwordExpiry),
        loginAttempts: String(loginAttempts),
      });
      toast.success('Cập nhật cài đặt thành công');
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('Có lỗi xảy ra khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const securitySettings = [
    {
      category: 'Xác Thực',
      icon: <Key className="w-6 h-6" />,
      color: 'blue',
      settings: [
        {
          name: 'Xác thực hai yếu tố (2FA)',
          description: 'Yêu cầu mã xác thực từ ứng dụng di động khi đăng nhập',
          enabled: twoFactorEnabled,
          toggle: () => setTwoFactorEnabled(!twoFactorEnabled)
        },
        {
          name: 'Đăng nhập bằng vân tay/Face ID',
          description: 'Cho phép đăng nhập bằng sinh trắc học trên thiết bị di động',
          enabled: true,
          toggle: () => { }
        }
      ]
    },
    {
      category: 'Mật Khẩu',
      icon: <Lock className="w-6 h-6" />,
      color: 'purple',
      settings: [
        {
          name: 'Yêu cầu mật khẩu mạnh',
          description: 'Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
          enabled: true,
          toggle: () => { }
        },
        {
          name: 'Lịch sử mật khẩu',
          description: 'Không cho phép sử dụng lại 5 mật khẩu gần nhất',
          enabled: true,
          toggle: () => { }
        }
      ]
    },
    {
      category: 'Phiên Làm Việc',
      icon: <Clock className="w-6 h-6" />,
      color: 'green',
      settings: [
        {
          name: 'Tự động đăng xuất',
          description: 'Đăng xuất tự động sau khi không hoạt động trong thời gian đã đặt',
          enabled: true,
          toggle: () => { }
        },
        {
          name: 'Giới hạn số phiên đồng thời',
          description: 'Chỉ cho phép đăng nhập tối đa 3 thiết bị cùng lúc',
          enabled: true,
          toggle: () => { }
        }
      ]
    },
    {
      category: 'Bảo Mật Nâng Cao',
      icon: <Shield className="w-6 h-6" />,
      color: 'red',
      settings: [
        {
          name: 'Mã hóa dữ liệu',
          description: 'Mã hóa tất cả dữ liệu nhạy cảm trong cơ sở dữ liệu',
          enabled: true,
          toggle: () => { }
        },
        {
          name: 'Giám sát hoạt động bất thường',
          description: 'Cảnh báo khi phát hiện hoạt động đăng nhập bất thường',
          enabled: true,
          toggle: () => { }
        },
        {
          name: 'IP Whitelist',
          description: 'Chỉ cho phép đăng nhập từ các địa chỉ IP được phê duyệt',
          enabled: false,
          toggle: () => { }
        }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải thiết lập bảo mật...</p>
      </div>
    );
  }

  const recentSecurityEvents = [
    {
      type: 'success',
      message: 'Đăng nhập thành công từ IP 192.168.1.100',
      user: 'admin',
      time: '2026-01-08 09:30:00'
    },
    {
      type: 'warning',
      message: 'Thử đăng nhập thất bại 3 lần',
      user: 'staff.user',
      time: '2026-01-08 08:15:00'
    },
    {
      type: 'info',
      message: 'Thay đổi mật khẩu thành công',
      user: 'manager.tech',
      time: '2026-01-07 17:45:00'
    },
    {
      type: 'warning',
      message: 'Đăng nhập từ thiết bị mới',
      user: 'accountant',
      time: '2026-01-07 14:20:00'
    },
    {
      type: 'success',
      message: 'Kích hoạt xác thực 2FA',
      user: 'hr.manager',
      time: '2026-01-06 11:00:00'
    }
  ];

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      red: 'bg-red-100 text-red-600'
    };
    return colors[color] || colors.blue;
  };

  const getEventTypeStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Thiết Lập Bảo Mật</h1>
        <p className="text-gray-600">Cấu hình các chính sách bảo mật và xác thực hệ thống</p>
      </div>

      {/* Security Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
          <Shield className="w-10 h-10 mb-3 opacity-80" />
          <h3 className="text-2xl font-bold mb-1">Cao</h3>
          <p className="text-green-100 text-sm">Mức độ bảo mật</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <Lock className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">{twoFactorEnabled ? 'BẬT' : 'TẮT'}</span>
          </div>
          <p className="text-gray-600 text-sm">Xác thực 2FA</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-800">{sessionTimeout}</span>
          </div>
          <p className="text-gray-600 text-sm">Phút timeout</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-800">0</span>
          </div>
          <p className="text-gray-600 text-sm">Cảnh báo bảo mật</p>
        </div>
      </div>

      {/* Security Settings */}
      <div className="space-y-6 mb-8">
        {securitySettings.map((category, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getCategoryColor(category.color)}`}>
                  {category.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800">{category.category}</h3>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {category.settings.map((setting, settingIndex) => (
                <div key={settingIndex} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">{setting.name}</h4>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                    </div>
                    <button
                      onClick={setting.toggle}
                      className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setting.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${setting.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Thời Gian Phiên Làm Việc
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tự động đăng xuất sau (phút)
              </label>
              <input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-sm text-gray-600">
              Hệ thống sẽ tự động đăng xuất người dùng sau {sessionTimeout} phút không hoạt động
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            Chính Sách Mật Khẩu
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Thời hạn mật khẩu (ngày)
              </label>
              <input
                type="number"
                value={passwordExpiry}
                onChange={(e) => setPasswordExpiry(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-sm text-gray-600">
              Yêu cầu người dùng đổi mật khẩu sau mỗi {passwordExpiry} ngày
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Kiểm Soát Đăng Nhập
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số lần đăng nhập thất bại tối đa
              </label>
              <input
                type="number"
                value={loginAttempts}
                onChange={(e) => setLoginAttempts(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-sm text-gray-600">
              Khóa tài khoản tạm thời sau {loginAttempts} lần đăng nhập thất bại
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            Quản Lý Thiết Bị
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Desktop - Chrome</p>
                  <p className="text-xs text-gray-600">IP: 192.168.1.100</p>
                </div>
              </div>
              <span className="text-xs text-green-600 font-semibold">Đang hoạt động</span>
            </div>
            <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-semibold">
              Đăng xuất tất cả thiết bị khác
            </button>
          </div>
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Nhật Ký Bảo Mật Gần Đây</h3>
        <div className="space-y-3">
          {recentSecurityEvents.map((event, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 border rounded-lg ${getEventTypeStyle(event.type)}`}
            >
              <div className="flex items-center gap-3">
                {event.type === 'success' && <Check className="w-5 h-5" />}
                {event.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                {event.type === 'info' && <Shield className="w-5 h-5" />}
                <div>
                  <p className="font-semibold text-sm">{event.message}</p>
                  <p className="text-xs opacity-75">Người dùng: {event.user}</p>
                </div>
              </div>
              <span className="text-xs opacity-75">{event.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end gap-4">
        <button
          onClick={fetchSettings}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg transition-colors"
        >
          Hủy Bỏ
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Đang Lưu...' : 'Lưu Cài Đặt'}
        </button>
      </div>
    </div>
  );
}

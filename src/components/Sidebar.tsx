import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImage from 'figma:asset/logo-bluebolt.png';
import {
  LayoutDashboard,
  Building2,
  Wallet,
  Users,
  Handshake,
  Settings,
  Database,
  ChevronDown,
  ChevronRight,
  Menu,
  Shield,
  Lock,
  FileText,
  FolderTree,
  DollarSign,
  Briefcase,
  Award,
  UserCog,
  CreditCard
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { currentUser } = useApp();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['admin', 'master']);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Báo Cáo',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/dashboard'
    },
    {
      id: 'bu',
      label: 'Quản Lý BU',
      icon: <Building2 className="w-5 h-5" />,
      path: '/quan-ly-bu'
    },
    {
      id: 'thu-chi',
      label: 'Quản Lý Thu Chi',
      icon: <Wallet className="w-5 h-5" />,
      path: '/quan-ly-thu-chi'
    },
    {
      id: 'nhan-su',
      label: 'Quản Lý Nhân Sự',
      icon: <Users className="w-5 h-5" />,
      path: '/quan-ly-nhan-su'
    },
    {
      id: 'doi-tac',
      label: 'Quản Lý Đối Tác',
      icon: <Handshake className="w-5 h-5" />,
      path: '/quan-ly-doi-tac'
    },
    {
      id: 'admin',
      label: 'Quản Trị Hệ Thống',
      icon: <Settings className="w-5 h-5" />,
      children: [
        {
          id: 'admin-users',
          label: 'Quản lý người dùng',
          icon: <Users className="w-4 h-4" />,
          path: '/admin/nguoi-dung'
        },
        {
          id: 'admin-roles',
          label: 'Phân quyền và vai trò',
          icon: <Shield className="w-4 h-4" />,
          path: '/admin/phan-quyen'
        },
        {
          id: 'admin-security',
          label: 'Thiết lập bảo mật',
          icon: <Lock className="w-4 h-4" />,
          path: '/admin/bao-mat'
        },
        {
          id: 'admin-logs',
          label: 'Nhật ký hệ thống',
          icon: <FileText className="w-4 h-4" />,
          path: '/admin/nhat-ky'
        }
      ]
    },
    {
      id: 'master',
      label: 'Master Data',
      icon: <Database className="w-5 h-5" />,
      children: [
        {
          id: 'master-category',
          label: 'Quản lý danh mục thu/chi/vay',
          icon: <FolderTree className="w-4 h-4" />,
          path: '/master/danh-muc'
        },
        {
          id: 'master-allocation',
          label: 'Phân bổ chi phí',
          icon: <DollarSign className="w-4 h-4" />,
          path: '/master/phan-bo-chi-phi'
        },
        {
          id: 'master-project',
          label: 'Quản lý dự án',
          icon: <Briefcase className="w-4 h-4" />,
          path: '/master/du-an'
        },
        {
          id: 'master-rank',
          label: 'Cấp bậc nhân sự',
          icon: <Award className="w-4 h-4" />,
          path: '/master/cap-bac'
        },
        {
          id: 'master-expertise',
          label: 'Chuyên môn/Vai trò',
          icon: <UserCog className="w-4 h-4" />,
          path: '/master/chuyen-mon'
        },
        {
          id: 'master-payment',
          label: 'Phương thức thanh toán',
          icon: <CreditCard className="w-4 h-4" />,
          path: '/master/thanh-toan'
        }
      ]
    }
  ];

  // Filter menu items based on user permissions
  const filteredMenuItems = React.useMemo(() => {
    // If no permissions defined (legacy or error), fallback to showing based on role
    if (!currentUser.permissions || currentUser.permissions.length === 0) {
      if (currentUser.role === 'Trưởng BU') {
        return menuItems.filter(item => item.id !== 'admin' && item.id !== 'master');
      }
      return menuItems;
    }

    // Mapping sidebar IDs to permission module keys
    const idToModuleMap: Record<string, string> = {
      'dashboard': 'bao_cao',
      'bu': 'quan_ly_bu',
      'thu-chi': 'thu_chi',
      'nhan-su': 'nhan_su',
      'doi-tac': 'doi_tac',
      'admin': 'he_thong',
      'master': 'master_data'
    };

    return menuItems.filter(item => {
      const moduleKey = idToModuleMap[item.id];
      if (!moduleKey) return true; // Show if no mapping exists

      const permission = currentUser.permissions?.find(p => p.module === moduleKey);
      return permission?.view !== false; // Show if view is true or person has no entry (default show)
    });
  }, [currentUser.role, currentUser.permissions]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? [] // Đóng menu nếu đang mở
        : [menuId] // Chỉ mở menu được click, đóng tất cả menu khác
    );
  };

  const isActive = (path?: string) => {
    return path && location.pathname === path;
  };

  const isParentActive = (children?: MenuItem[]) => {
    return children?.some(child => child.path && location.pathname === child.path);
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const active = isActive(item.path);
    const parentActive = isParentActive(item.children);

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleMenu(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${parentActive ? 'text-white' : 'text-gray-700 hover:bg-blue-50 hover:text-[#004aad]'
              } ${collapsed ? 'justify-center' : ''}`}
            style={parentActive ? { backgroundColor: '#004aad' } : {}}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </div>
            {!collapsed && (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {!collapsed && isExpanded && (
            <div className="bg-gray-50">
              {item.children?.map(child => renderMenuItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const Component = item.path ? Link : 'div';
    const props = item.path ? { to: item.path } : {};

    return (
      <Component
        key={item.id}
        {...props}
        className={`flex items-center gap-3 px-4 py-3 transition-colors ${depth > 0 ? 'pl-12' : ''
          } ${active ? 'text-white' : 'text-gray-700 hover:bg-blue-50 hover:text-[#004aad]'} ${collapsed ? 'justify-center' : ''
          }`}
        style={active ? { backgroundColor: '#004aad' } : {}}
      >
        {item.icon}
        {!collapsed && <span className="font-medium">{item.label}</span>}
      </Component>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white text-gray-800 shadow-xl border-r border-gray-200 transition-all duration-300 z-50 ${collapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Header */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-gray-200 h-20`}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="BLUEBOLT" className="h-18 w-auto" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggle}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-[#004aad]"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-[#004aad]"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="py-4 overflow-y-auto h-[calc(100vh-80px)]">
        {filteredMenuItems.map(item => renderMenuItem(item))}
      </nav>
    </aside>
  );
}

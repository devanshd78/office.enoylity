"use client";

import React, { useState, useEffect, FC, JSX } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Lexend } from 'next/font/google';
import { BsBuilding } from 'react-icons/bs';
import { FaFileInvoiceDollar, FaMoneyCheckAlt, FaUsers } from 'react-icons/fa';
import { FiChevronUp, FiChevronDown, FiLogOut, FiMoreHorizontal, FiSettings, FiMenu } from 'react-icons/fi';
import Header from './topbar';

// Load Lexend font if needed
const lexend = Lexend({ subsets: ['latin'], weight: ['400', '700'] });

type NavItem = 'dashboard' | 'invoice' | 'payslip' | 'employee' | 'useraccess' | 'settings';
type SubMenuItem = 'mhdtech' | 'enoylitystudio' | 'enoylitytech';
type SubSettingItem = 'invoice' | 'payslip' | 'update';

// Invoice submenu definitions
const invoiceSubMenus: { key: SubMenuItem; label: string }[] = [
  { key: 'mhdtech', label: 'MHD Tech' },
  { key: 'enoylitystudio', label: 'Enoylity Studio' },
  { key: 'enoylitytech', label: 'Enoylity Media Creations LLC' },
];

const setingsSubMenus: { key: SubSettingItem; label: string }[] = [
  { key: 'invoice', label: 'Invoice' },
  { key: 'payslip', label: 'Payslip' },
  { key: 'update', label: 'Update Login' }
];

const Sidebar: FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Which panels to hide
  const [hiddenPanels, setHiddenPanels] = useState<NavItem[]>([]);

  // Desktop invoice collapse
  const [openInvoice, setOpenInvoice] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  // Mobile submenu & logout
  const [mobileSubMenu, setMobileSubMenu] = useState<NavItem | null>(null);
  const [showLogoutMobile, setShowLogoutMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const getHiddenPanels = (): NavItem[] => {
    const role = localStorage.getItem('role');
    if (role === 'admin') {
      return ['dashboard', 'invoice', 'payslip', 'employee', 'useraccess', 'settings']; // Show all
    }

    const permissionsRaw = localStorage.getItem('permissions');
    if (!permissionsRaw) return [];

    try {
      const permissions = JSON.parse(permissionsRaw);

      const visible: NavItem[] = [];
      if (permissions['View Invoice details'] || permissions['Generate invoice details']) {
        visible.push('invoice');
      }
      if (permissions['View payslip details'] || permissions['Generate payslip']) {
        visible.push('payslip');
      }
      if (permissions['View Employee Details'] || permissions['Add Employee Details']) {
        visible.push('employee');
      }
      if (permissions['User Access']) {
        visible.push('useraccess');
      }
      if (permissions['Manage Settings']) {
        visible.push('settings');
      }
      visible.push('dashboard'); // Always show dashboard

      return visible;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    setHiddenPanels(getHiddenPanels());
  }, []);

  useEffect(() => {
    // automatically open invoice submenu if on an invoice route
    setOpenInvoice(pathname.startsWith('/invoice'));
  }, [pathname]);

  const selectedNav: NavItem | '' = (
    pathname === '/' ? 'dashboard' :
      pathname.startsWith('/invoice') ? 'invoice' :
        pathname.startsWith('/payslip') ? 'payslip' :
          pathname.startsWith('/employee') ? 'employee' :
            pathname.startsWith('/useraccess') ? 'useraccess' :
              pathname.startsWith('/settings') ? 'settings' : ''
  );

  const navigateTo = (path: string) => {
    setMobileSubMenu(null);
    setShowLogoutMobile(false);
    void router.push(path);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('adminId');
      localStorage.removeItem('subadminId');
      localStorage.removeItem('permissions');
      localStorage.removeItem('role');
    } catch (err) {
      console.error('Error clearing localStorage:', err);
    }
    setHiddenPanels([]);
    void router.push('/login');
  };


  const toggleInvoice = () => setOpenInvoice(prev => !prev);
  const toggleSettings = () => setOpenSettings(prev => !prev);

  const handleMobileNav = (item: NavItem) => {
    if (item === 'invoice' || item === 'settings') {
      setMobileSubMenu(prev => (prev === item ? null : item));
    } else {
      setMobileSidebarOpen(false);
      navigateTo(item === 'dashboard' ? '/' : `/${item}`);
    }
  };

  const menuItemBase = 'flex items-center px-3 py-2 rounded-lg cursor-pointer transition hover:bg-indigo-600 hover:text-white';
  const activeClass = 'bg-indigo-100 text-indigo-700';

  // Utility: should we show this nav item?
  const isVisible = (item: NavItem) => hiddenPanels.includes(item);

  return (
    <>
      {/* Desktop sidebar */}
      <Header onMenuClick={() => setMobileSidebarOpen(prev => !prev)} />

      <aside className={`${lexend.className} hidden sm:flex flex-col fixed top-0 left-0 h-screen w-60 border-r bg-white`}>
        <div className="flex items-center p-4 cursor-pointer" onClick={() => navigateTo('/')}>
          <BsBuilding className="mr-2 text-2xl text-indigo-600" />
          <span className="text-l font-medium">Enoylity Dashboard</span>
        </div>


        <nav className="flex-1 overflow-y-auto p-2 space-y-2">
          {isVisible('invoice') && (
            <>
              <div
                className={`${menuItemBase} justify-between ${selectedNav === 'invoice' ? activeClass : ''}`}
                onClick={toggleInvoice}
              >
                <div className="flex items-center">
                  <FaFileInvoiceDollar className="mr-3 text-lg" />
                  Invoice
                </div>
                {openInvoice ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              {openInvoice && (
                <div className="pl-8 space-y-1">
                  {invoiceSubMenus.map(({ key, label }) => (
                    <div
                      key={key}
                      className={`${menuItemBase} !px-0 ${pathname === `/invoice/${key}` ? activeClass : ''}`}
                      onClick={() => navigateTo(`/invoice/${key}`)}
                    >
                      <FaFileInvoiceDollar className="mr-3 text-lg" />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {isVisible('payslip') && (
            <div
              className={`${menuItemBase} ${selectedNav === 'payslip' ? activeClass : ''}`}
              onClick={() => navigateTo('/payslip')}
            >
              <FaMoneyCheckAlt className="mr-3 text-lg" />
              Payslip
            </div>
          )}

          {isVisible('employee') && (
            <div
              className={`${menuItemBase} ${selectedNav === 'employee' ? activeClass : ''}`}
              onClick={() => navigateTo('/employee')}
            >
              <FaUsers className="mr-3 text-lg" />
              Employee
            </div>
          )}

          {isVisible('useraccess') && (
            <div
              className={`${menuItemBase} ${selectedNav === 'useraccess' ? activeClass : ''}`}
              onClick={() => navigateTo('/useraccess')}
            >
              <FaUsers className="mr-3 text-lg rotate-180" />
              User Access
            </div>
          )}

          {isVisible('settings') && (
            <>
              <div
                className={`${menuItemBase} justify-between ${selectedNav === 'settings' ? activeClass : ''}`}
                onClick={toggleSettings}
              >
                <div className="flex items-center">
                  <FiSettings className="mr-3 text-lg" />
                  Settings
                </div>
                {openSettings ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              {openSettings && (
                <div className="pl-8 space-y-1">
                  {setingsSubMenus.map(({ key, label }) => (
                    <div
                      key={key}
                      className={`${menuItemBase} !px-0 ${pathname === `/settings/${key}` ? activeClass : ''}`}
                      onClick={() => navigateTo(`/settings/${key}`)}
                    >
                      <FaFileInvoiceDollar className="mr-3 text-lg" />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 rounded-lg hover:bg-red-600 hover:text-white transition"
          >
            <FiLogOut className="mr-2 text-lg" /> Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black opacity-30" onClick={() => setMobileSidebarOpen(false)} />

          {/* Sidebar */}
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-semibold">Menu</span>
              <button onClick={() => setMobileSidebarOpen(false)}>✕</button>
            </div>

            {(['dashboard', 'invoice', 'payslip', 'employee', 'useraccess', 'settings'] as NavItem[])
              .filter(isVisible)
              .map((item) => (
                <div key={item}>
                  <button
                    onClick={() => handleMobileNav(item)}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-left hover:bg-indigo-100"
                  >
                    {item === 'dashboard' && <BsBuilding className="mr-3 text-lg" />}
                    {item === 'invoice' && <FaFileInvoiceDollar className="mr-3 text-lg" />}
                    {item === 'payslip' && <FaMoneyCheckAlt className="mr-3 text-lg" />}
                    {item === 'employee' && <FaUsers className="mr-3 text-lg" />}
                    {item === 'useraccess' && <FaUsers className="mr-3 text-lg rotate-180" />}
                    {item === 'settings' && <FiSettings className="mr-3 text-lg" />}
                    <span className="capitalize">{item}</span>
                  </button>

                  {/* Nested submenu for invoice/settings */}
                  {mobileSubMenu === item && (
                    <div className="ml-6 mt-2 space-y-2">
                      {(item === 'invoice' ? invoiceSubMenus : setingsSubMenus).map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => {
                            setMobileSidebarOpen(false);
                            navigateTo(`/${item}/${key}`);
                          }}                          
                          className="w-full flex items-center px-3 py-2 rounded-lg text-left hover:bg-indigo-200"
                        >
                          <span className="text-sm">{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            <button
              onClick={handleLogout}
              className="w-full mt-6 text-left px-3 py-2 rounded-lg hover:bg-red-600 hover:text-white transition"
            >
              <FiLogOut className="mr-2 inline" /> Log Out
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
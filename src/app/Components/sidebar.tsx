"use client";

import React, { useState, useEffect, FC, JSX } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Lexend } from 'next/font/google';
import { BsBuilding } from 'react-icons/bs';
import { FaFileInvoiceDollar, FaMoneyCheckAlt, FaUsers } from 'react-icons/fa';
import { FiChevronUp, FiChevronDown, FiLogOut, FiMoreHorizontal } from 'react-icons/fi';

// Load Lexend font if needed
const lexend = Lexend({ subsets: ['latin'], weight: ['400', '700'] });

type NavItem = 'dashboard' | 'invoice' | 'payslip' | 'employees' | 'useraccess';
type SubMenuItem = 'mhd' | 'enoylitystudio' | 'enoylitytech';

// Invoice submenu definitions
const invoiceSubMenus: { key: SubMenuItem; label: string }[] = [
  { key: 'mhd', label: 'MHD Tech' },
  { key: 'enoylitystudio', label: 'Enoylity Studio' },
  { key: 'enoylitytech', label: 'Enoylity Tech' },
];

const Sidebar: FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Which panels to hide
  const [hiddenPanels, setHiddenPanels] = useState<NavItem[]>([]);

  // Desktop invoice collapse
  const [openInvoice, setOpenInvoice] = useState(false);

  // Mobile submenu & logout
  const [mobileSubMenu, setMobileSubMenu] = useState<NavItem | null>(null);
  const [showLogoutMobile, setShowLogoutMobile] = useState(false);

  // Read hidden panels from localStorage
const getHiddenPanels = (): NavItem[] => {
  const stored = localStorage.getItem('show')
  if (!stored) {
    return []
  }
  try {
    return JSON.parse(stored) as NavItem[]
  } catch {
    return []
  }
}
  
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
          pathname.startsWith('/employee') ? 'employees' :
            pathname.startsWith('/useraccess') ? 'useraccess' : ''
  );

  const navigateTo = (path: string) => {
    setMobileSubMenu(null);
    setShowLogoutMobile(false);
    void router.push(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    void router.push('/login');
  };

  const toggleInvoice = () => setOpenInvoice(prev => !prev);

  const handleMobileNav = (item: NavItem) => {
    setShowLogoutMobile(false);
    if (item === 'invoice') {
      setMobileSubMenu(prev => (prev === item ? null : item));
    } else {
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
      <aside className={`${lexend.className} hidden sm:flex flex-col fixed top-0 left-0 h-screen w-60 border-r bg-white`}>
        <div className="flex items-center p-4 cursor-pointer" onClick={() => navigateTo('/')}>
          <BsBuilding className="mr-2 text-2xl text-indigo-600" />
          <span className="text-xl font-medium">Office Panel</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-2">
          {isVisible('dashboard') && (
            <div
              className={`${menuItemBase} ${selectedNav === 'dashboard' ? activeClass : ''}`}
              onClick={() => navigateTo('/')}
            >
              <BsBuilding className="mr-3 text-lg" />
              Dashboard
            </div>
          )}

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

          {isVisible('employees') && (
            <div
              className={`${menuItemBase} ${selectedNav === 'employees' ? activeClass : ''}`}
              onClick={() => navigateTo('/employee')}
            >
              <FaUsers className="mr-3 text-lg" />
              Employees
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

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-3 left-1/2 transform -translate-x-1/2 w-11/12 bg-white rounded-2xl shadow-lg p-3 flex justify-evenly sm:hidden">
        {(['dashboard', 'invoice', 'payslip', 'employees', 'useraccess'] as NavItem[]).map(item => {
          if (!isVisible(item)) return null;
          const icons: Record<NavItem, JSX.Element> = {
            dashboard: <BsBuilding className="text-2xl" />,
            invoice: <FaFileInvoiceDollar className="text-2xl" />,
            payslip: <FaMoneyCheckAlt className="text-2xl" />,
            employees: <FaUsers className="text-2xl" />,
            useraccess: <FaUsers className="text-2xl rotate-180" />,
          };
          return (
            <button
              key={item}
              type="button"
              onClick={() => handleMobileNav(item)}
              className={`flex flex-col items-center text-sm ${selectedNav === item
                  ? 'text-indigo-600 font-semibold border-t-2 border-indigo-600 pt-1'
                  : 'text-gray-500'
                }`}
            >
              {icons[item]}
              <span className="mt-1 capitalize">{item}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowLogoutMobile(prev => !prev)}
          className="flex flex-col items-center text-sm text-gray-500"
        >
          <FiMoreHorizontal className="text-2xl" />
        </button>
      </nav>

      {/* Mobile invoice submenu */}
      {mobileSubMenu === 'invoice' && isVisible('invoice') && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg max-h-40 overflow-y-auto sm:hidden">
          {invoiceSubMenus.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => navigateTo(`/invoice/${key}`)}
              className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition"
            >
              <FaFileInvoiceDollar className="mr-3 text-lg" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Mobile logout dropdown */}
      {showLogoutMobile && (
        <div className="fixed bottom-20 right-5 bg-white p-4 rounded-lg shadow-lg sm:hidden">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-600 hover:text-white transition"
          >
            Log Out
          </button>
        </div>
      )}
    </>
  );
};

export default Sidebar;

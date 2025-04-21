"use client";

import React, { FC, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const colorClasses: Record<string, { headerText: string; headerBorder: string; iconBg: string; iconText: string }> = {
  indigo: {
    headerText: 'text-indigo-600',
    headerBorder: 'border-indigo-200',
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-500',
  },
  emerald: {
    headerText: 'text-emerald-600',
    headerBorder: 'border-emerald-200',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-500',
  },
  amber: {
    headerText: 'text-amber-600',
    headerBorder: 'border-amber-200',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-500',
  },
  teal: {
    headerText: 'text-teal-600',
    headerBorder: 'border-teal-200',
    iconBg: 'bg-teal-50',
    iconText: 'text-teal-500',
  },
};

const groups = [
  {
    title: 'Invoice',
    options: [
      { title: 'MHD', route: '/invoice/mhd', icon: '🧾' },
      { title: 'Enoylity', route: '/invoice/enoylity', icon: '🧾' },
      { title: 'Enoylity Tech', route: '/invoice/enytech', icon: '🧾' },
    ],
    color: 'indigo',
    roles: ['admin'],
  },
  {
    title: 'Payslip',
    options: [{ title: 'Enoylity', route: '/payslip/enoylity', icon: '📄' }],
    color: 'emerald',
    roles: ['admin', 'user'],
  },
  {
    title: 'Employees',
    options: [
      { title: 'Add', route: '/employee/add', icon: '➕' },
      { title: 'View', route: '/employee', icon: '👥' },
    ],
    color: 'teal',
    roles: ['admin', 'user'],
  },
  {
    title: 'User Access',
    options: [{ title: 'New', route: '/useraccess', icon: '🛡️' }],
    color: 'amber',
    roles: ['admin'],
  },
];

const Dashboard: FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('user');
  const [visiblePanels, setVisiblePanels] = useState<string[]>([]);

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if (!adminId) {
      router.replace('/login'); // Redirect to login if not authenticated
    }
  }, [router]);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      setUserRole(storedRole.toLowerCase());
    }

    const storedPanels = localStorage.getItem('show');
    if (storedPanels) {
      try {
        const parsed = JSON.parse(storedPanels);
        if (Array.isArray(parsed)) {
          setVisiblePanels(parsed.map((p) => p.toLowerCase()));
        } else {
          throw new Error('Invalid format');
        }
      } catch {
        console.error('Invalid visiblePanels format in localStorage');
        setVisiblePanels([]);
      }
    } else {
      setVisiblePanels(groups.map((g) => g.title.toLowerCase()));
    }
  }, []);

  const isVisibleGroup = (groupTitle: string) => {
    return visiblePanels.includes(groupTitle.toLowerCase());
  };

  return (
    <div className="bg-indigo-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard</h1>

        {groups
          .filter((group) => group.roles.includes(userRole) && isVisibleGroup(group.title))
          .map((group, gi) => {
            const classes = colorClasses[group.color] || colorClasses['indigo'];

            return (
              <section key={gi} className="mb-12">
                <h2
                  className={`text-2xl font-semibold ${classes.headerText} border-b-2 ${classes.headerBorder} pb-2 mb-6`}
                >
                  {group.title}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.options.map((opt, oi) => (
                    <div
                      key={oi}
                      onClick={() => router.push(opt.route)}
                      className="bg-white border border-transparent rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-200 hover:shadow-lg transition"
                    >
                      <div className={`${classes.iconBg} p-4 rounded-full mb-4`}>
                        <span className={`${classes.iconText} text-4xl`}>{opt.icon}</span>
                      </div>
                      <p className="text-lg font-medium text-gray-700">{opt.title}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
};

export default Dashboard;

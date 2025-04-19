"use client";

import React, { FC } from 'react';
import { useRouter } from 'next/navigation';

// Tailwind class mappings for each group color
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
  teal: {
    headerText: 'text-teal-600',
    headerBorder: 'border-teal-200',
    iconBg: 'bg-teal-50',
    iconText: 'text-teal-500',
  },
};

// Dashboard groups and options with emoji icons
const groups = [
  {
    title: 'Invoice',
    options: [
      { title: 'MHD', route: '/invoice/mhd', icon: '🧾' },
      { title: 'Enoylity', route: '/invoice/enoylity', icon: '🧾' },
      { title: 'Enoylity Tech', route: '/invoice/enytech', icon: '🧾' },
    ],
    color: 'indigo',
  },
  {
    title: 'Payslip',
    options: [
      { title: 'Enoylity', route: '/payslip/enoylity', icon: '📄' },
    ],
    color: 'emerald',
  },
  {
    title: 'Employee',
    options: [
      { title: 'Add', route: '/employee/add', icon: '➕' },
      { title: 'View', route: '/employee', icon: '👥' },
    ],
    color: 'teal',
  },
];

const Dashboard: FC = () => {
  const router = useRouter();

  return (
    <div className="bg-indigo-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard</h1>

        {groups.map((group, gi) => {
          const classes = colorClasses[group.color] || colorClasses.indigo;
          return (
            <section key={gi} className="mb-12">
              <h2 className={`text-2xl font-semibold ${classes.headerText} border-b-2 ${classes.headerBorder} pb-2 mb-6`}>
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

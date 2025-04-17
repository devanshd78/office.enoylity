"use client";

import React, { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

type Option = {
  title: string;
  route: string;
  icon: string;
};

type Group = {
  groupTitle: string;
  options: Option[];
};

const groups: Group[] = [
  {
    groupTitle: "Invoice",
    options: [
      { title: "Generate Invoice for Enoylity", route: "/invoice/enoylity", icon: "🧾" },
      { title: "Generate Invoice for MHD", route: "/invoice/mhd", icon: "🧾" },
    ],
  },
  {
    groupTitle: "Payslip",
    options: [
      { title: "Payslip for Enoylity", route: "/payslip/enoylity", icon: "📄" },
      { title: "Payslip for MHD", route: "/payslip/mhd", icon: "📄" },
    ],
  },
  {
    groupTitle: "Employee",
    options: [
      { title: "Add Employee", route: "/employee/add", icon: "➕" },
      { title: "View Employee", route: "/employee", icon: "👥" },
    ],
  },
];

const Dashboard: FC = () => {
  const router = useRouter();
  const isMobile = useIsMobile();

  return (
    <div className={`bg-indigo-100 min-h-screen ${isMobile ? 'p-4' : 'p-8'} pb-20`}>      
      {groups.map((group, gi) => (
        <section key={gi} className={`${isMobile ? 'mb-6' : 'mb-10'}`}>
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-4`}>{group.groupTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.options.map((opt, oi) => (
              <div
                key={oi}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center text-center"
                onClick={() => router.push(opt.route)}
              >
                <span className="text-6xl">{opt.icon}</span>
                <p className="mt-2 text-xl">{opt.title}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Dashboard;

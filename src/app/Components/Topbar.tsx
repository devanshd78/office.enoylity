import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';


export default function Topbar({ breadcrumbs }) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow">
      {/* Mobile: Back Button */}
      <button
        onClick={() => router.back()}
        className="md:hidden flex items-center text-gray-600 hover:text-gray-800"
        aria-label="Go Back"
      >
        <ChevronLeft size={24} />
        <span className="ml-1">Back</span>
      </button>

      {/* Desktop: Breadcrumbs */}
      <nav className="hidden md:flex space-x-2 text-gray-600">
        {breadcrumbs.map((crumb: Breadcrumb, index: number) => (
          <div key={index} className="flex items-center">
            <Link href={crumb.href} className="hover:underline">
              {crumb.label}
            </Link>
            {index < breadcrumbs.length - 1 && (
              <span className="mx-2">/</span>
            )}
          </div>
        ))}
      </nav>
    </header>
  );
}

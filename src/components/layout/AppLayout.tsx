import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Workbench Dashboard',
  '/recipes': 'Recipe Book (คลังสูตร)',
  '/recipes/new': 'สร้างสูตรเครื่องดื่มใหม่',
  '/ingredients': 'คลังวัตถุดิบ (Ingredients)',
  '/categories': 'จัดการหมวดหมู่ (Categories)',
  '/training': 'คู่มือและเทคนิคการทำงาน (Training Guide)',
  '/practice': 'ระบบฝึกจำสูตร (Practice Mode)',
  '/simulator': 'บาริสต้าจำลองสถานการณ์ (Barista Simulator)',
  '/settings': 'ตั้งค่าระบบและสำรองข้อมูล (Settings)',
  '/login': 'เข้าสู่ระบบ / บัญชีผู้ใช้ (Account)',
};

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Match title or dynamic recipe edit
  let currentTitle = PAGE_TITLES[location.pathname] || '';
  if (location.pathname.startsWith('/recipes/') && location.pathname.includes('/edit')) {
    currentTitle = 'แก้ไขสูตรเครื่องดื่ม';
  } else if (location.pathname.startsWith('/recipes/') && location.pathname !== '/recipes/new') {
    currentTitle = 'รายละเอียดสูตร';
  }

  return (
    <div className="min-h-screen bg-cafe-bg dark:bg-cafe-darkBg text-cafe-text dark:text-cafe-cream flex">
      {/* Sidebar */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar
          title={currentTitle}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

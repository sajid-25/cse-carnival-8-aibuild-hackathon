import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl animate-in fade-in-0 duration-200">
      {children}
    </div>
  );
}

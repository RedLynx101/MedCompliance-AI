import { Link, useLocation } from "wouter";
import { Stethoscope, Settings, User, Database, ChevronDown, Bell, Shield, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const [location] = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navigationItems = [
    { href: "/", label: "Dashboard", testId: "nav-dashboard" },
    { href: "/encounter", label: "Live Encounter", testId: "nav-encounter" },
    { href: "/analytics", label: "Analytics", testId: "nav-analytics" },
    { href: "/ehr-integration", label: "EHR Integration", testId: "nav-ehr-integration", icon: Database }
  ];

  const handleMobileLinkClick = () => {
    setShowMobileMenu(false);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-18">
          {/* Mobile Logo - Compact */}
          <div className="flex items-center md:hidden">
            <div className="flex-shrink-0">
              <h1 className="text-lg font-bold text-white flex items-center group cursor-pointer">
                <div className="bg-white/10 p-1.5 rounded-lg mr-2 group-hover:bg-white/20 transition-colors">
                  <Stethoscope className="text-white" size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold leading-tight">MedCompliance AI</span>
                </div>
              </h1>
            </div>
          </div>

          {/* Desktop Logo - Full */}
          <div className="hidden md:flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-white flex items-center group cursor-pointer">
                <div className="bg-white/10 p-2 rounded-lg mr-3 group-hover:bg-white/20 transition-colors">
                  <Stethoscope className="text-white" size={28} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold">MedCompliance AI</span>
                  <span className="text-xs text-blue-200 font-medium">Healthcare Documentation Platform</span>
                </div>
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="ml-12">
              <div className="flex items-baseline space-x-1">
                {navigationItems.map((item) => (
                  <Link key={item.href} href={item.href} data-testid={item.testId}>
                    <button className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center ${
                      isActive(item.href) 
                        ? "bg-white/20 text-white shadow-md border border-white/30" 
                        : "text-blue-200 hover:text-white hover:bg-white/10"
                    }`}>
                      {item.icon && <item.icon className="mr-1.5 h-4 w-4" />}
                      {item.label}
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile + Desktop Right Side */}
          <div className="flex items-center space-x-2">
            {/* Notification Bell - Responsive */}
            <div className="relative">
              <button className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors" data-testid="button-notifications">
                <Bell size={18} className="sm:w-5 sm:h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-xs">
                  3
                </span>
              </button>
            </div>

            {/* User Profile - Responsive */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 sm:space-x-3 bg-white/10 hover:bg-white/20 rounded-lg px-2 sm:px-4 py-2 transition-colors border border-white/20" 
                data-testid="button-user-menu"
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="bg-blue-500 rounded-full p-1 sm:p-1.5">
                    <User size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-white text-sm font-medium">Dr. Sarah Chen</span>
                    <span className="text-blue-200 text-xs">Cardiologist</span>
                  </div>
                </div>
                <ChevronDown size={14} className="text-blue-200 sm:w-4 sm:h-4" />
              </button>

              {/* User Dropdown Menu - Responsive */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Dr. Sarah Chen</p>
                    <p className="text-sm text-gray-500">sarah.chen@hospital.com</p>
                    <div className="flex items-center mt-1">
                      <Shield size={14} className="text-green-500 mr-1" />
                      <span className="text-xs text-green-600 font-medium">HIPAA Verified</span>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link href="/settings">
                      <button 
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        data-testid="dropdown-settings"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={16} className="mr-3 text-gray-400" />
                        Settings & Preferences
                      </button>
                    </Link>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" data-testid="dropdown-profile">
                      <User size={16} className="mr-3 text-gray-400" />
                      Profile Management
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" data-testid="dropdown-security">
                      <Shield size={16} className="mr-3 text-gray-400" />
                      Security & Compliance
                    </button>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" data-testid="dropdown-signout">
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                data-testid="button-mobile-menu"
              >
                {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-blue-500/20 bg-blue-700/50 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href} data-testid={`mobile-${item.testId}`}>
                  <button 
                    onClick={handleMobileLinkClick}
                    className={`w-full text-left px-3 py-3 text-base font-medium rounded-lg transition-all duration-200 flex items-center ${
                      isActive(item.href) 
                        ? "bg-white/20 text-white shadow-md border border-white/30" 
                        : "text-blue-200 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                    {item.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

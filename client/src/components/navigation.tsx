import { Link, useLocation } from "wouter";
import { Stethoscope, Settings, User, Database, ChevronDown, Bell, Shield } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const [location] = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18">
          <div className="flex items-center">
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
            <div className="hidden md:block ml-12">
              <div className="flex items-baseline space-x-1">
                <Link href="/" data-testid="nav-dashboard">
                  <button className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive("/") 
                      ? "bg-white/20 text-white shadow-md border border-white/30" 
                      : "text-blue-200 hover:text-white hover:bg-white/10"
                  }`}>
                    Dashboard
                  </button>
                </Link>
                <Link href="/encounter" data-testid="nav-encounter">
                  <button className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive("/encounter") 
                      ? "bg-white/20 text-white shadow-md border border-white/30" 
                      : "text-blue-200 hover:text-white hover:bg-white/10"
                  }`}>
                    Live Encounter
                  </button>
                </Link>
                <Link href="/analytics" data-testid="nav-analytics">
                  <button className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive("/analytics") 
                      ? "bg-white/20 text-white shadow-md border border-white/30" 
                      : "text-blue-200 hover:text-white hover:bg-white/10"
                  }`}>
                    Analytics
                  </button>
                </Link>
                <Link href="/ehr-integration" data-testid="nav-ehr-integration">
                  <button className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center ${
                    isActive("/ehr-integration") 
                      ? "bg-white/20 text-white shadow-md border border-white/30" 
                      : "text-blue-200 hover:text-white hover:bg-white/10"
                  }`}>
                    <Database className="mr-1.5 h-4 w-4" />
                    EHR Integration
                  </button>
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <div className="relative">
              <button className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors" data-testid="button-notifications">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>
            </div>

            {/* User Profile */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 transition-colors border border-white/20" 
                data-testid="button-user-menu"
              >
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-500 rounded-full p-1.5">
                    <User size={18} className="text-white" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white text-sm font-medium">Dr. Sarah Chen</span>
                    <span className="text-blue-200 text-xs">Cardiologist</span>
                  </div>
                </div>
                <ChevronDown size={16} className="text-blue-200" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
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
          </div>
        </div>
      </div>
    </nav>
  );
}

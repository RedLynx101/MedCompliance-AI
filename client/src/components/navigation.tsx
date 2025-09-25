import { Link, useLocation } from "wouter";
import { Stethoscope, Settings, User, Database } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary flex items-center">
                <Stethoscope className="mr-2" size={24} />
                MedCompliance AI
              </h1>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link href="/" data-testid="nav-dashboard">
                  <button className={`px-3 py-2 text-sm font-medium ${
                    isActive("/") ? "tab-active" : "text-muted-foreground hover:text-foreground"
                  }`}>
                    Dashboard
                  </button>
                </Link>
                <Link href="/encounter" data-testid="nav-encounter">
                  <button className={`px-3 py-2 text-sm font-medium ${
                    isActive("/encounter") ? "tab-active" : "text-muted-foreground hover:text-foreground"
                  }`}>
                    Live Encounter
                  </button>
                </Link>
                <Link href="/analytics" data-testid="nav-analytics">
                  <button className={`px-3 py-2 text-sm font-medium ${
                    isActive("/analytics") ? "tab-active" : "text-muted-foreground hover:text-foreground"
                  }`}>
                    Analytics
                  </button>
                </Link>
                <Link href="/ehr-integration" data-testid="nav-ehr-integration">
                  <button className={`px-3 py-2 text-sm font-medium ${
                    isActive("/ehr-integration") ? "tab-active" : "text-muted-foreground hover:text-foreground"
                  }`}>
                    <Database className="mr-1 h-4 w-4 inline" />
                    EHR Integration
                  </button>
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User size={16} />
              <span>Dr. Sarah Chen</span>
            </div>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90" data-testid="button-settings">
              <Settings className="mr-2" size={16} />
              Settings
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

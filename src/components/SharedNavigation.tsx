import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, Users, QrCode, BarChart, User, LogOut, Menu, X, Bell, Home, LayoutDashboard, BarChart3, AlertTriangle, FileText, Mail, Network, Activity, Building2, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TenantSwitcher } from "@/components/TenantSwitcher";

interface SharedNavigationProps {
  userRole: string;
  userName?: string;
  userEmail?: string;
}

export function SharedNavigation({ userRole, userName, userEmail }: SharedNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch notifications count based on user role
    const fetchNotifications = async () => {
      try {
        let count = 0;

        switch (userRole) {
          case 'resident': {
            // TODO: Replace with actual FastAPI endpoint
            // Count pending invitations
            count = Math.floor(Math.random() * 5); // Placeholder: random count
            break;
          }

          case 'guard': {
            // TODO: Replace with actual FastAPI endpoint
            // Count recent incidents
            count = Math.floor(Math.random() * 3); // Placeholder: random count
            break;
          }

          case 'admin': {
            // TODO: Replace with actual FastAPI endpoint
            // Count system alerts
            count = Math.floor(Math.random() * 7); // Placeholder: random count
            break;
          }
        }

        setNotifications(count);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [userRole]);

  const handleLogout = async () => {
    try {
      // TODO: Replace with actual FastAPI logout endpoint
      // For now, clear local storage and redirect
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      navigate('/login');
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'resident':
        return <User className="h-5 w-5 text-blue-600" />;
      case 'guard':
        return <Shield className="h-5 w-5 text-green-600" />;
      case 'admin':
        return <BarChart className="h-5 w-5 text-purple-600" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'resident':
        return 'bg-blue-100 text-blue-800';
      case 'guard':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleName = () => {
    switch (userRole) {
      case 'resident':
        return 'Resident';
      case 'guard':
        return 'Security Guard';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  const getNavigationItems = () => {
    switch (userRole) {
      case 'admin': {
        return [
          { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
          { name: 'Analytics', href: '/analytics', icon: BarChart3 },
          { name: 'Integration', href: '/enterprise-integration', icon: Network },
          { name: 'Workflow', href: '/workflow-automation', icon: Activity },
          { name: 'Locations', href: '/multi-location', icon: Building2 },
          { name: 'Security', href: '/security-compliance', icon: Shield },
          { name: 'API', href: '/api-management', icon: Server },
        ];
      }
      case 'guard': {
        return [
          { name: 'Security', href: '/security-guard', icon: Shield },
          { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
          { name: 'Reports', href: '/reports', icon: FileText },
        ];
      }
      case 'resident': {
        return [
          { name: 'Dashboard', href: '/resident-dashboard', icon: Home },
          { name: 'Invitations', href: '/invitations', icon: Mail },
          { name: 'Visitors', href: '/visitors', icon: Users },
        ];
      }
      default:
        return [{ name: 'Dashboard', href: '/', icon: Home }];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden lg:flex border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">SecureGate Kenya</h1>
                <p className="text-xs text-muted-foreground">Digital Visitor Management</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => navigate(item.href)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {notifications}
                  </Badge>
                )}
              </Button>

              {/* Tenant Switcher */}
              <TenantSwitcher />

              {/* User Profile */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getRoleIcon()}
                  <div className="text-right">
                    <p className="text-sm font-medium">{userName || 'User'}</p>
                    <Badge className={getRoleColor()}>
                      {getRoleName()}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-bold">SecureGate</h1>
                <p className="text-xs text-muted-foreground">Kenya</p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
                    {notifications}
                  </Badge>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 pb-4 border-b">
                    {getRoleIcon()}
                    <div>
                      <p className="font-medium">{userName || 'User'}</p>
                      <p className="text-sm text-muted-foreground">{userEmail}</p>
                      <Badge className={getRoleColor()}>
                        {getRoleName()}
                      </Badge>
                    </div>
                  </div>

                  {/* Tenant Switcher */}
                  <div className="pb-2 border-b">
                    <TenantSwitcher />
                  </div>

                  {/* Navigation Links */}
                  <nav className="space-y-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      return (
                        <Button
                          key={item.name}
                          variant={isActive ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            navigate(item.href);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {item.name}
                        </Button>
                      );
                    })}
                  </nav>

                  {/* Logout */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}



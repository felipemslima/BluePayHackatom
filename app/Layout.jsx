import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, CreditCard, Send, History, User as UserIcon, LogOut } from "lucide-react";
import { User } from "@/entities/User";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Início", url: createPageUrl("Dashboard"), icon: Home },
  { title: "Pagamentos", url: createPageUrl("Payment"), icon: Send },
  { title: "Cartões", url: createPageUrl("Cards"), icon: CreditCard },
  { title: "Extrato", url: createPageUrl("Transactions"), icon: History },
  { title: "Perfil", url: createPageUrl("Profile"), icon: UserIcon },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("User not logged in");
    }
  };

  const handleLogout = async () => {
    await User.logout();
  };

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --background: 240 15% 9%;
          --foreground: 240 5% 96%;
          --primary: 243 75% 59%;
          --primary-foreground: 0 0% 100%;
          --card: 240 12% 12%;
          --card-foreground: 240 5% 96%;
          --border: 240 8% 20%;
        }
        
        body {
          background: linear-gradient(135deg, #0f1420 0%, #1a1f36 100%);
          min-height: 100vh;
        }
      `}</style>
      
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r border-white/10 bg-[#1a1f36]/95 backdrop-blur-xl">
          <SidebarHeader className="border-b border-white/10 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">NeoBank</h2>
                <p className="text-xs text-gray-400">Seu banco digital</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-white/5 transition-all duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-400 border-l-2 border-indigo-500' 
                            : 'text-gray-300'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-white/10 p-4">
            {user && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user.full_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{user.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-[#1a1f36]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-white/5 p-2 rounded-lg transition-colors text-white" />
              <h1 className="text-xl font-bold text-white">NeoBank</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
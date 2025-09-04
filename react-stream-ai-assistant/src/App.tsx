import { AuthenticatedApp } from "@/components/authenticated-app";
import { Login } from "@/components/login";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/providers/theme-provider";
import { useState } from "react";
import { User } from "stream-chat";

const USER_STORAGE_KEY = "chat-ai-app-user";

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleUserLogin = (authenticatedUser: User) => {
    const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${authenticatedUser.name}`;
    const userWithImage = {
      ...authenticatedUser,
      image: avatarUrl,
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithImage));
    setUser(userWithImage);
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row md:overflow-hidden">
        {/* Main content area */}
        <main className="flex-1 w-full max-w-full px-2 py-4 md:px-8 md:py-8 overflow-x-auto">
          {user ? (
            <AuthenticatedApp user={user} onLogout={handleLogout} />
          ) : (
            <Login onLogin={handleUserLogin} />
          )}
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;

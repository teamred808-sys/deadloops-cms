import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

// Public Pages
import HomePage from "./pages/HomePage";
import BlogPostPage from "./pages/BlogPostPage";
import HubPage from "./pages/HubPage";
import PillarPage from "./pages/PillarPage";
import ProgrammaticPage from "./pages/ProgrammaticPage";
import RSSFeedPage from "./pages/RSSFeedPage";
import NotFound from "./pages/NotFound";
import AuthorProfilePage from "./pages/AuthorProfilePage";

// Admin Layout and Pages (synchronous for instant navigation)
import AdminLayout from "./components/admin/AdminLayout";
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import PostsPage from "./pages/admin/PostsPage";
import PostEditorPage from "./pages/admin/PostEditorPage";
import MediaPage from "./pages/admin/MediaPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import AuthorsPage from "./pages/admin/AuthorsPage";
import FooterPagesPage from "./pages/admin/FooterPagesPage";
import FooterPageDetail from "./pages/FooterPageDetail";
import RootSlugPage from "./pages/RootSlugPage";

{/* Public Routes */ }
              <Route path="/" element={<HomePage />} />
              <Route path="/page/:pageNumber" element={<HomePage />} />
{/* <Route path="/blog/:slug" element={<BlogPostPage />} /> REMOVED */ }

{/* SEO Hub Routes */ }
{/* <Route path="/blog/:hubSlug" element={<HubPage />} /> REMOVED */ }

{/* Pillar Page Routes - specific routes only */ }
              <Route path="/mixing-mastering-guide" element={<PillarPage />} />
              <Route path="/home-studio-setup-guide" element={<PillarPage />} />
              <Route path="/music-production-for-beginners" element={<PillarPage />} />
              <Route path="/ultimate-sample-packs-guide" element={<PillarPage />} />
              <Route path="/music-gear-buying-guide" element={<PillarPage />} />

{/* Programmatic SEO Routes */ }
<Route path="/genre/:genre/:templateType" element={<ProgrammaticPage />} />

{/* Author Profile Routes */ }
              <Route path="/author/:authorSlug" element={<AuthorProfilePage />} />
              <Route path="/author/:authorSlug/page/:pageNumber" element={<AuthorProfilePage />} />

{/* Admin Routes - MUST be before /:pillarSlug catch-all */ }
              <Route path="/superuser" element={<LoginPage />} />
              <Route path="/admin/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
              <Route path="/admin/posts" element={<AdminRoute><PostsPage /></AdminRoute>} />
              <Route path="/admin/posts/new" element={<AdminRoute><PostEditorPage /></AdminRoute>} />
              <Route path="/admin/posts/edit/:id" element={<AdminRoute><PostEditorPage /></AdminRoute>} />
              <Route path="/admin/authors" element={<AdminRoute><AuthorsPage /></AdminRoute>} />
              <Route path="/admin/media" element={<AdminRoute><MediaPage /></AdminRoute>} />
              <Route path="/admin/categories" element={<AdminRoute><CategoriesPage /></AdminRoute>} />
              <Route path="/admin/pages" element={<AdminRoute><FooterPagesPage /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
              <Route path="/admin" element={<AdminRoute><DashboardPage /></AdminRoute>} />

{/* Footer/Static Pages */ }
<Route path="/p/:pageSlug" element={<FooterPageDetail />} />

{/* ROOT SLUG DISPATCHER - Handles Posts, Hubs, and Pillars at root level */ }
{/* MUST be near the end but before 404 */ }
<Route path="/:slug" element={<RootSlugPage />} />

{/* 404 Catch-all */ }
<Route path="*" element={<NotFound />} />
            </Routes >
            </TrackingWrapper >
          </BrowserRouter >
        </TooltipProvider >
      </AuthProvider >
    </ThemeProvider >
  </QueryClientProvider >
  );
};

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { RecipesPage } from './pages/RecipesPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { RecipeEditPage } from './pages/RecipeEditPage';
import { IngredientsPage } from './pages/IngredientsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { TrainingPage } from './pages/TrainingPage';
import { PracticePage } from './pages/PracticePage';
import { SimulatorPage } from './pages/SimulatorPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 mins
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="recipes" element={<RecipesPage />} />
                <Route path="recipes/new" element={<RecipeEditPage />} />
                <Route path="recipes/:id" element={<RecipeDetailPage />} />
                <Route path="recipes/:id/edit" element={<RecipeEditPage />} />
                <Route path="ingredients" element={<IngredientsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="training" element={<TrainingPage />} />
                <Route path="practice" element={<PracticePage />} />
                <Route path="simulator" element={<SimulatorPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="login" element={<AuthPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

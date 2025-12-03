export type View = 'home' | 'log-meal' | 'history' | 'analytics' | 'gamification' | 'recommendations' | 'settings';

export interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  view: View;
}

export interface ViewProps {
  onBack: () => void;
}

export interface DashboardViewProps {
  onNavigate: (view: View) => void;
}

export interface User {
  name: string;
  email: string;
  avatar: string | null;
}

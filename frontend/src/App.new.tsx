import { useEffect, useState } from 'react';
import { 
  FiHome, 
  FiPlusCircle, 
  FiClock, 
  FiBarChart2, 
  FiAward, 
  FiThumbsUp, 
  FiMenu, 
  FiX,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import MealLogger from './components/MealLogger';

// Define the view types
type View = 'home' | 'log-meal' | 'history' | 'analytics' | 'gamification' | 'recommendations';

// Navigation items
const navigation = [
  { name: 'Dashboard', icon: FiHome, view: 'home' as View },
  { name: 'Log Meal', icon: FiPlusCircle, view: 'log-meal' as View },
  { name: 'Meal History', icon: FiClock, view: 'history' as View },
  { name: 'Analytics', icon: FiBarChart2, view: 'analytics' as View },
  { name: 'Gamification', icon: FiAward, view: 'gamification' as View },
  { name: 'Recommendations', icon: FiThumbsUp, view: 'recommendations' as View },
];

const App = () => {
  const [apiStatus, setApiStatus] = useState<string>('checking...');
  const [currentView, setCurrentView] = useState<View>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check API status on mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch(
          import.meta.env.VITE_API_URL 
            ? `${import.meta.env.VITE_API_URL}/health` 
            : 'http://localhost:8000/health'
        );
        await response.json();
        setApiStatus('ok');
      } catch (error) {
        setApiStatus('error');
      }
    };

    checkApiStatus();
  }, []);

  // Render the current view
  const renderView = () => {
    switch (currentView) {
      case 'log-meal':
        return <MealLogger onBack={() => setCurrentView('home')} />;
      // Add other view cases here
      case 'home':
      default:
        return (
          <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome to NutriSathi</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {navigation.map((item) => (
                <button
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
                >
                  <item.icon className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Click to view {item.name.toLowerCase()}</p>
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-4 right-4 z-50">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white shadow-md"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Sidebar */}
        <div 
          className={`fixed inset-y-0 left-0 transform ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 w-64 bg-white shadow-lg z-40 transition-transform duration-300 ease-in-out`}
        >
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">NutriSathi</h1>
            <p className="text-sm text-gray-500">Your AI Nutrition Coach</p>
          </div>
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  setCurrentView(item.view);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                  currentView === item.view
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 min-h-screen transition-all duration-300">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {/* API Status Indicator */}
            {apiStatus === 'error' && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      Could not connect to the backend server. Some features may be limited.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {apiStatus === 'ok' && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiCheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Backend connected! You can now log meals and track nutrition.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Render the current view */}
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;

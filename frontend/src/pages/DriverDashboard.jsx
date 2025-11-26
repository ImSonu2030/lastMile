import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function DriverDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚖</span>
            <h1 className="text-2xl font-bold text-white">Driver Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1: Route Setup */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Set Your Route
            </h2>
            <div className="space-y-4">
              <div className="h-40 bg-gray-900/50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-700 group hover:border-blue-500/50 transition-colors cursor-pointer">
                <span className="text-4xl mb-2 opacity-50 group-hover:opacity-100 transition-opacity">🗺️</span>
                <span className="text-gray-500 group-hover:text-gray-300 transition-colors">Select Route</span>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg">
                Start Route
              </button>
            </div>
          </div>

          {/* Card 2: Status */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                <span className="text-gray-400">Status</span>
                <span className="font-bold text-emerald-400 px-2 py-1 bg-emerald-400/10 rounded">Online</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                <span className="text-gray-400">Active Rides</span>
                <span className="font-bold text-white">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
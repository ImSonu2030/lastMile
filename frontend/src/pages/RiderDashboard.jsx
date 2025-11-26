import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function RiderDashboard() {
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
            <span className="text-2xl">👋</span>
            <h1 className="text-2xl font-bold text-white">Rider Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Request a Ride</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase font-semibold ml-1 mb-1 block">From</label>
              <input 
                type="text" 
                placeholder="Current Location (X, Y)" 
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-500 uppercase font-semibold ml-1 mb-1 block">To</label>
              <input 
                type="text" 
                placeholder="Destination (X, Y)" 
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
            
            <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-lg transition-colors shadow-lg mt-2 flex items-center justify-center gap-2">
              <span>🚗</span> Find a Driver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
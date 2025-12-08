import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../stores/AuthContext";
import { useDriverLogic } from "../hooks/useDriverLogic";
import { driverService } from "../api/driverService";
import Header from "../components/Header";
import DriverStatusCard from "../components/driver/DriverStatusCard";
import JobCard from "../components/driver/JobCard";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline, isDriving, location, currentRide, toggleOnline } = useDriverLogic(user);

  const driverName = user?.email ? user.email.split('@')[0] : "Driver";

  const handleLogout = async () => {
    if (user && location) {
      await driverService.updateLocation(user.id, location.x, location.y, "offline");
    }
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen p-6 bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Pass the driverName here */}
        <Header 
          title="Driver Dashboard" 
          onLogout={handleLogout} 
          userName={driverName} 
        />

        {!location ? (
          <div className="text-center text-gray-400 mt-10">Loading driver location...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <DriverStatusCard 
                isOnline={isOnline} 
                isDriving={isDriving} 
                location={location} 
                toggleOnline={toggleOnline} 
              />
              <JobCard currentRide={currentRide} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
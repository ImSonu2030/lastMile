import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/AuthContext';
import { useRiderLogic } from '../hooks/useRiderLogic';
import Header from '../components/Header';
import CityMap from '../components/rider/CityMap';
import RideRequestForm from '../components/rider/RideRequestForm';

export default function RiderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const riderName = user?.email ? user.email.split('@')[0] : "Rider";
  const {
    stations,
    drivers,
    selectedStation,
    setSelectedStation,
    destination,
    setDestination,
    arrivalTime,
    setArrivalTime,
    rideStatus,
    handleRequestRide
  } = useRiderLogic(user);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-6 bg-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto">
        <Header title="Rider Dashboard" onLogout={handleLogout} userName={riderName} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CityMap 
            stations={stations} 
            drivers={drivers} 
            selectedStation={selectedStation} 
            onSelectStation={setSelectedStation} 
          />
          
          <RideRequestForm 
            selectedStation={selectedStation}
            destination={destination}
            setDestination={setDestination}
            arrivalTime={arrivalTime}
            setArrivalTime={setArrivalTime}
            rideStatus={rideStatus}
            onRequestRide={handleRequestRide}
            activeDriversCount={drivers.length}
          />
        </div>
      </div>
    </div>
  );
}
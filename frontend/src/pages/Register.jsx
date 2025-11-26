import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('rider');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // 1. Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return alert(error.message);

    // 2. Create Profile with Role
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, email, role }]);
        
      if (profileError) console.error('Error creating profile:', profileError);
      
      alert('Registration successful! Please login.');
      navigate('/login');
    }
  };

  return (
    <div className="container">
      <h2>Join LastMile</h2>
      <form onSubmit={handleRegister}>
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
        
        <label>I am a:</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="rider">Rider</option>
          <option value="driver">Driver</option>
        </select>
        
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}
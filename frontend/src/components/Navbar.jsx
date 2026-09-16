import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldAlert } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <nav className="bg-panel border-b border-gray-800 p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2 text-primary">
          <ShieldAlert size={28} />
          <span className="text-xl font-bold tracking-wider text-text-main hidden sm:inline">Military Activity Monitor</span>
          <span className="text-xl font-bold tracking-wider text-text-main sm:hidden">M.A.M</span>
        </div>
        
        <div className="flex items-center space-x-4 text-text-muted">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-text-main">{user.name}</span>
            <span className="text-xs uppercase bg-gray-800 rounded px-2 py-0.5 mt-0.5 inline-block text-primary-dark">
              {user.role}
            </span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 bg-gray-800 rounded-full hover:bg-danger hover:text-white transition-colors duration-200"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

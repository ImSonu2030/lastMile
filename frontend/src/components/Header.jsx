import React from 'react';

export default function Header({ title, onLogout, userName }) {
  return (
    <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-gray-100">{title}</h1>
        {userName && (
          <span className="text-sm text-emerald-400 font-mono mt-1">
            👤 {userName}
          </span>
        )}
      </div>
      
      <button
        onClick={onLogout}
        className="text-red-400 border font-bold border-gray-100/20 px-4 py-2 rounded cursor-pointer hover:bg-gray-700 transition-colors duration-200"
      >
        Logout
      </button>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { db } from '../../services/database';
import { Vehicle } from '../../types';

const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [newVehicle, setNewVehicle] = useState('');
  const [loading, setLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await db.getVehicles();
      setVehicles(data);
    } catch (e) {
      alert('Failed to load vehicles');
    }
    setLoading(false);
  };

  useEffect(() => { loadVehicles(); }, []);

  const handleAdd = async () => {
    if (!newVehicle.trim()) return;
    setLoading(true);
    try {
      await db.addVehicle(newVehicle.trim());
      setNewVehicle('');
      setAddSuccess(true);
      await loadVehicles();
      setTimeout(() => setAddSuccess(false), 800);
    } catch (e: any) {
      alert(e.message || 'Failed to add vehicle');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this vehicle number?')) return;
    setLoading(true);
    try {
      await db.deleteVehicle(id);
      await loadVehicles();
    } catch (e: any) {
      alert(e.message || 'Failed to delete vehicle');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-4 sm:p-6 mt-8 animate-fade-in">
      <h2 className="text-lg sm:text-xl font-bold mb-4 text-blue-800">Vehicle Numbers</h2>
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          type="text"
          value={newVehicle}
          onChange={e => setNewVehicle(e.target.value)}
          placeholder="e.g. KA01EE4455"
          className={`flex-1 border rounded px-3 py-2 transition-all duration-200 focus:ring-2 focus:ring-blue-400 ${addSuccess ? 'ring-2 ring-green-400' : ''}`}
          aria-label="Vehicle number"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !newVehicle.trim()}
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-1 transition-all duration-200 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <span className="flex items-center">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Saving...
            </span>
          ) : (
            <>Save Vehicle</>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Type a vehicle number and click <b>Save Vehicle</b> to add.
      </p>
      {/* Mobile: Cards, Desktop: List */}
      <ul className="space-y-2">
        {vehicles.length === 0 && (
          <li className="text-gray-500 animate-fade-in">No vehicles added yet.</li>
        )}
        {vehicles.map((v: Vehicle) => (
          <li
            key={v.id}
            className="flex justify-between items-center border rounded-lg px-3 py-2 bg-gray-50 hover:bg-blue-50 transition animate-fade-in"
            style={{ animationDuration: '0.4s' }}
          >
            <span className="font-medium text-gray-800">{v.vehicle_number}</span>
            <button
              onClick={() => handleDelete(v.id)}
              className="text-red-600 hover:text-red-800 transition-colors p-2 rounded"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px);}
          to { opacity: 1; transform: none;}
        }
        .animate-fade-in { animation: fade-in 0.4s;}
      `}</style>
    </div>
  );
};

export default VehicleList;
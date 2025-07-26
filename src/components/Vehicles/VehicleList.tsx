import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { db } from '../../services/database';
import { Vehicle } from '../../types';

const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [newVehicle, setNewVehicle] = useState('');
  const [loading, setLoading] = useState(false);

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
      await loadVehicles();
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
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">Vehicle Numbers</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newVehicle}
          onChange={e => setNewVehicle(e.target.value)}
          placeholder="Enter vehicle number"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !newVehicle.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      <ul>
        {vehicles.map((v: Vehicle) => (
          <li key={v.id} className="flex justify-between items-center border-b py-2">
            <span>{v.vehicle_number}</span>
            <button
              onClick={() => handleDelete(v.id)}
              className="text-red-600 hover:text-red-800"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {vehicles.length === 0 && <li className="text-gray-500">No vehicles added yet.</li>}
      </ul>
    </div>
  );
};

export default VehicleList;
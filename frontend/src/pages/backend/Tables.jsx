import { useEffect, useState } from 'react';

import api from '../../api/client';
import toast from 'react-hot-toast';
import { LayoutGrid, Plus, Trash2, X, User } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-slate-800 rounded-2xl w-full max-w-md shadow-pop-lg animate-popIn">
        <div className="flex items-center justify-between p-5 border-b-2 border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 font-outfit">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}


export default function Tables() {
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [modal, setModal] = useState(null);
  const [tableForm, setTableForm] = useState({ tableNumber: '', seats: 4, floorId: '' });
  const [floorName, setFloorName] = useState('');


  const load = async () => {
    try {
      const [f, t] = await Promise.all([api.get('/floors'), api.get('/tables')]);
      setFloors(f); setTables(t);
      if (!selectedFloor && f.length > 0) setSelectedFloor(f[0].id);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filteredTables = tables.filter(t => t.floorId === selectedFloor);

  const addFloor = async (e) => {
    e.preventDefault();
    if (!floorName.trim()) return;
    try { await api.post('/floors', { name: floorName }); setFloorName(''); setModal(null); toast.success('Floor added'); load(); }
    catch { toast.error('Failed to add floor'); }
  };

  const deleteFloor = async (id) => {
    try { await api.delete(`/floors/${id}`); toast.success('Floor deleted'); setSelectedFloor(null); load(); }
    catch { toast.error('Failed'); }
  };

  const addTable = async (e) => {
    e.preventDefault();
    try { await api.post('/tables', { ...tableForm, floorId: selectedFloor }); setModal(null); toast.success('Table added'); load(); }
    catch { toast.error('Failed to add table'); }
  };

  const deleteTable = async (id) => {
    try { await api.delete(`/tables/${id}`); toast.success('Table removed'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 font-semibold">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <LayoutGrid size={24} className="text-[#8B5CF6]" />
          <h1 className="text-2xl font-black text-slate-800 font-outfit">Floor & Tables</h1>
        </div>
        <button
          onClick={() => setModal('addFloor')}
          className="bg-[#8B5CF6] hover:bg-[#7c4ee4] text-white border-2 border-slate-800 rounded-xl font-bold px-4 py-2.5 text-sm shadow-pop-sm hover:translate-y-[-2px] active:translate-y-[2px] transition-all flex items-center gap-1.5"
        >
          <Plus size={16} /> Add Floor
        </button>
      </div>

      <div className="flex gap-6">
        {/* Floors Sidebar */}
        <div className="w-52 shrink-0">
          <div className="text-xs text-slate-500 uppercase font-bold mb-3 px-1">Floors</div>
          <div className="space-y-2">
            {floors.map(f => (
              <div
                key={f.id}
                onClick={() => setSelectedFloor(f.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer border-2 transition-all duration-200 ${
                  selectedFloor === f.id
                    ? 'bg-[#8B5CF6] text-white border-slate-800 shadow-pop-sm translate-y-[-1px]'
                    : 'bg-white text-slate-700 border-slate-100 hover:border-slate-200'
                }`}
              >
                <span className="text-sm font-bold font-outfit">{f.name}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteFloor(f.id); }}
                  className={`p-1 rounded-md transition ${selectedFloor === f.id ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {floors.length === 0 && <div className="text-slate-400 text-xs px-1 font-semibold">No floors yet</div>}
          </div>
        </div>

        {/* Tables Grid */}
        <div className="flex-1">
          {selectedFloor ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="text-slate-500 text-sm font-semibold">{filteredTables.length} tables on this floor</div>
                <button
                  onClick={() => { setTableForm({ tableNumber: '', seats: 4, floorId: selectedFloor }); setModal('addTable'); }}
                  className="bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-800 px-3.5 py-2 rounded-xl text-sm font-bold shadow-pop-sm hover:translate-y-[-1px] active:translate-y-[1px] transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Table
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTables.map(t => (
                  <div key={t.id} className="bg-white border-2 border-slate-800 rounded-2xl p-4 relative group hover:shadow-pop shadow-pop-sm transition-all hover:translate-y-[-2px]">
                    <button
                      onClick={() => deleteTable(t.id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 p-1 hover:bg-slate-50 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="text-2xl font-black text-slate-800 mb-1 font-outfit">{t.tableNumber}</div>
                    <div className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <User size={12} className="text-slate-400" />
                      <span>{t.seats} seats</span>
                    </div>
                    <div className="text-xs mt-3.5 font-bold flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${t.currentOrderId ? 'bg-[#FBBF24] animate-pulse' : 'bg-[#34D399]'}`} />
                      <span className={t.currentOrderId ? 'text-[#e5aa1c]' : 'text-[#2ba376]'}>
                        {t.currentOrderId ? 'Occupied' : 'Available'}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredTables.length === 0 && (
                  <div className="col-span-full bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-400 font-semibold">
                    No tables on this floor. Add one!
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 font-semibold">Select a floor to view tables</div>
          )}
        </div>
      </div>

      {modal === 'addFloor' && (
        <Modal title="Add Floor" onClose={() => setModal(null)}>
          <form onSubmit={addFloor} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Floor Name *</label>
              <input required value={floorName} onChange={e => setFloorName(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#8B5CF6] transition font-semibold"
                placeholder="e.g. Ground Floor" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl transition font-bold text-sm">Cancel</button>
              <button type="submit" className="flex-1 bg-[#8B5CF6] hover:bg-[#7c4ee4] text-white border-2 border-slate-800 py-2.5 rounded-xl transition font-bold text-sm shadow-pop-sm hover:translate-y-[-1px] active:translate-y-[1px]">Add Floor</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'addTable' && (
        <Modal title="Add Table" onClose={() => setModal(null)}>
          <form onSubmit={addTable} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Table Number *</label>
              <input required value={tableForm.tableNumber} onChange={e => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#8B5CF6] transition font-semibold"
                placeholder="e.g. T7" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Seats</label>
              <input type="number" min="1" value={tableForm.seats} onChange={e => setTableForm({ ...tableForm, seats: e.target.value })}
                className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#8B5CF6] transition font-semibold" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl transition font-bold text-sm">Cancel</button>
              <button type="submit" className="flex-1 bg-[#8B5CF6] hover:bg-[#7c4ee4] text-white border-2 border-slate-800 py-2.5 rounded-xl transition font-bold text-sm shadow-pop-sm hover:translate-y-[-1px] active:translate-y-[1px]">Add Table</button>
            </div>
          </form>
        </Modal>
      )}


    </div>
  );
}

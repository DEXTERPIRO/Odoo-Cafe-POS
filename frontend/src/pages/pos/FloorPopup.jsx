import { useEffect, useState } from 'react';
import { Armchair, ShoppingBag, X } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function FloorPopup({ onSelect, onNoTable, onClose, session, isInline = false }) {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const floorsRes = await api.get('/floors');
        setFloors(floorsRes);
      } catch (e) {
        toast.error('Failed to load floor data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTableOrder = (table) => {
    return table.orders?.[0] || null;
  };

  const getTableStatus = (table) => {
    if (!table.isActive) return 'inactive';
    const order = getTableOrder(table);
    return order ? 'occupied' : 'available';
  };

  /* Flat list metrics of all tables across floors */
  const totalTables = floors.reduce((n, f) => n + (f.tables?.filter(t => t.isActive).length || 0), 0);
  const occupied = floors.reduce((n, f) => n + (f.tables?.filter(t => t.isActive && getTableOrder(t))?.length || 0), 0);

  if (isInline) {
    return (
      <div className="h-full flex flex-col bg-white border-2 border-slate-800 rounded-2xl overflow-hidden animate-fadeIn" style={{ boxShadow: 'var(--pop-shadow-sm)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-100 shrink-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-outfit">Select Table / Floor View</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-jakarta">
              {occupied} occupied · {totalTables - occupied} available · {totalTables} total
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-[#FFFDF5]">
          {loading && (
            <div className="flex items-center justify-center h-40 text-slate-500 font-jakarta">Loading tables…</div>
          )}

          {!loading && floors.length === 0 && (
            <div className="text-center py-12 text-slate-500 font-jakarta">
              <div className="flex justify-center mb-3">
                <Armchair size={48} className="text-slate-300" />
              </div>
              <p className="font-bold text-slate-700">No floors configured yet.</p>
              <p className="text-xs mt-1">Go to Backend → Floor & Tables to add them.</p>
            </div>
          )}

          {floors.map(floor => (
            <div key={floor.id} className="mb-6">
              {/* Floor header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-violet-600 font-bold text-sm font-outfit">{floor.name}</span>
                <span className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400 font-jakarta">{floor.tables?.filter(t => t.isActive).length} tables</span>
              </div>

              {/* Tables grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {floor.tables?.filter(t => t.isActive).map(table => {
                  const status = getTableStatus(table);
                  const order = getTableOrder(table);

                  return (
                    <button
                      key={table.id}
                      onClick={() => status !== 'inactive' && onSelect(table, order)}
                      disabled={status === 'inactive'}
                      className={`
                        relative p-4 rounded-xl border-2 transition text-left group font-jakarta
                        ${status === 'available'
                          ? 'bg-white border-slate-200 hover:border-slate-800'
                          : status === 'occupied'
                          ? 'bg-[#FDF4FF] border-violet-500 hover:border-violet-700'
                          : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'}
                      `}
                      style={{
                        boxShadow: status !== 'inactive' ? 'var(--pop-shadow-sm)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800 text-lg font-outfit">
                          {table.tableNumber.toUpperCase()}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          status === 'available' ? 'bg-emerald-500' :
                          status === 'occupied' ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'
                        }`} />
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{table.seats} seats</div>
                      {status === 'occupied' && order && (
                        <div className={`mt-2 text-xs font-bold px-2 py-0.5 rounded border inline-block ${
                          order.status === 'READY'
                            ? 'text-violet-800 bg-violet-200/80 border-violet-450'
                            : order.status === 'SENT_TO_KITCHEN'
                            ? 'text-blue-700 bg-blue-100/60 border-blue-200'
                            : 'text-violet-700 bg-violet-100/60 border-violet-200'
                        }`}>
                          ₹{parseFloat(order.total).toFixed(0)} •{' '}
                          {order.status === 'READY' ? '✓ Ready' : order.status === 'SENT_TO_KITCHEN' ? 'Kitchen' : 'Draft'}
                        </div>
                      )}

                      {/* Hover overlay for occupied */}
                      {status === 'occupied' && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-violet-600/0 group-hover:bg-violet-600/5 transition">
                          <span className="text-xs text-violet-700 opacity-0 group-hover:opacity-100 font-bold transition">
                            Open Order →
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Empty state for floor */}
                {(!floor.tables || floor.tables.filter(t => t.isActive).length === 0) && (
                  <div className="col-span-4 py-4 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl font-jakarta">
                    No tables on this floor
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer — No Table / Takeaway */}
        <div className="px-6 py-4 border-t-2 border-slate-100 shrink-0 bg-white rounded-b-2xl">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-jakarta">For walk-in or takeaway orders without a table</p>
            </div>
            <button
              onClick={onNoTable}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 border-2 border-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-pop-sm"
            >
              <ShoppingBag size={14} className="text-white" />
              <span className="font-outfit">No Table (Takeaway)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div 
        className="bg-white border-2 border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        style={{ boxShadow: 'var(--pop-shadow-lg)', animation: 'modalIn 0.18s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-outfit">Select Table</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-jakarta">
              {occupied} occupied · {totalTables - occupied} available · {totalTables} total
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 bg-[#FFFDF5]">
          {loading && (
            <div className="flex items-center justify-center h-40 text-slate-500 font-jakarta">Loading tables…</div>
          )}

          {!loading && floors.length === 0 && (
            <div className="text-center py-12 text-slate-500 font-jakarta">
              <div className="flex justify-center mb-3">
                <Armchair size={48} className="text-slate-300" />
              </div>
              <p className="font-bold text-slate-700">No floors configured yet.</p>
              <p className="text-xs mt-1">Go to Backend → Floor & Tables to add them.</p>
            </div>
          )}

          {floors.map(floor => (
            <div key={floor.id} className="mb-6">
              {/* Floor header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-violet-600 font-bold text-sm font-outfit">{floor.name}</span>
                <span className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400 font-jakarta">{floor.tables?.filter(t => t.isActive).length} tables</span>
              </div>

              {/* Tables grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {floor.tables?.filter(t => t.isActive).map(table => {
                  const status = getTableStatus(table);
                  const order = getTableOrder(table);

                  return (
                    <button
                      key={table.id}
                      onClick={() => status !== 'inactive' && onSelect(table, order)}
                      disabled={status === 'inactive'}
                      className={`
                        relative p-4 rounded-xl border-2 transition text-left group font-jakarta
                        ${status === 'available'
                          ? 'bg-white border-slate-200 hover:border-slate-800'
                          : status === 'occupied'
                          ? 'bg-[#FDF4FF] border-violet-500 hover:border-violet-700'
                          : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'}
                      `}
                      style={{
                        boxShadow: status !== 'inactive' ? 'var(--pop-shadow-sm)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800 text-lg font-outfit">
                          {table.tableNumber.toUpperCase()}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          status === 'available' ? 'bg-emerald-500' :
                          status === 'occupied' ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'
                        }`} />
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{table.seats} seats</div>
                      {status === 'occupied' && order && (
                        <div className={`mt-2 text-xs font-bold px-2 py-0.5 rounded border inline-block ${
                          order.status === 'READY'
                            ? 'text-violet-800 bg-violet-200/80 border-violet-400'
                            : order.status === 'SENT_TO_KITCHEN'
                            ? 'text-blue-700 bg-blue-100/60 border-blue-200'
                            : 'text-violet-700 bg-violet-100/60 border-violet-200'
                        }`}>
                          ₹{parseFloat(order.total).toFixed(0)} •{' '}
                          {order.status === 'READY' ? '✓ Ready' : order.status === 'SENT_TO_KITCHEN' ? 'Kitchen' : 'Draft'}
                        </div>
                      )}

                      {/* Hover overlay for occupied */}
                      {status === 'occupied' && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-violet-600/0 group-hover:bg-violet-600/5 transition">
                          <span className="text-xs text-violet-700 opacity-0 group-hover:opacity-100 font-bold transition">
                            Open Order →
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Empty state for floor */}
                {(!floor.tables || floor.tables.filter(t => t.isActive).length === 0) && (
                  <div className="col-span-4 py-4 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl font-jakarta">
                    No tables on this floor
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer — No Table / Takeaway */}
        <div className="px-6 py-4 border-t-2 border-slate-100 shrink-0 bg-white rounded-b-2xl">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-jakarta">For walk-in or takeaway orders without a table</p>
            </div>
            <button
              onClick={onNoTable}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 border-2 border-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition"
              style={{ boxShadow: 'var(--pop-shadow-sm)' }}
            >
              <ShoppingBag size={14} className="text-white" />
              <span className="font-outfit">No Table (Takeaway)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

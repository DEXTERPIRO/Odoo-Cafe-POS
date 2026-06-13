import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Banknote, CreditCard, Smartphone, Check, Settings, AlertTriangle } from 'lucide-react';

const METHOD_META = {
  CASH: { icon: Banknote, color: 'text-[#34D399]', label: 'Cash', desc: 'Accept physical cash payments' },
  CARD: { icon: CreditCard, color: 'text-[#8B5CF6]', label: 'Card / Digital', desc: 'Accept debit, credit & contactless payments' },
  UPI: { icon: Smartphone, color: 'text-[#F472B6]', label: 'UPI', desc: 'Accept UPI payments via QR code or ID' },
};

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-12 h-6.5 rounded-full border-2 border-slate-800 transition-colors relative ${checked ? 'bg-[#34D399]' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white border-2 border-slate-800 rounded-full shadow transition-all ${checked ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
    </button>
  );
}

export default function PaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [forms, setForms] = useState({});
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.get('/payment-methods');
      setMethods(data);
      const f = {};
      data.forEach(m => { f[m.id] = { isEnabled: m.isEnabled, upiId: m.upiId || '' }; });
      setForms(f);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (method) => {
    setSaving(s => ({ ...s, [method.id]: true }));
    try {
      await api.put(`/payment-methods/${method.id}`, forms[method.id]);
      toast.success(`${METHOD_META[method.name]?.label} settings saved`);
      load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(s => ({ ...s, [method.id]: false })); }
  };

  const update = (id, key, val) => setForms(f => ({ ...f, [id]: { ...f[id], [key]: val } }));

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 font-semibold">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <CreditCard size={24} className="text-[#34D399]" />
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-outfit leading-none">Payment Methods</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">Configure accepted payment methods for your POS terminal</p>
        </div>
      </div>

      <div className="grid gap-6">
        {methods.map(method => {
          const meta = METHOD_META[method.name] || {};
          const form = forms[method.id] || {};
          const MetaIcon = meta.icon;
          return (
            <div
              key={method.id}
              className={`bg-white border-2 rounded-2xl p-6 shadow-pop transition-all ${
                form.isEnabled ? 'border-slate-800' : 'border-slate-300 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 flex items-center justify-center bg-slate-50 border-2 border-slate-800 rounded-xl shadow-pop-sm shrink-0 ${meta.color}`}>
                    {MetaIcon && <MetaIcon size={24} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold font-outfit text-lg">{meta.label}</h3>
                    <p className="text-slate-500 text-sm font-medium">{meta.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase">{form.isEnabled ? 'Enabled' : 'Disabled'}</span>
                  <Toggle checked={form.isEnabled} onChange={() => update(method.id, 'isEnabled', !form.isEnabled)} />
                </div>
              </div>

              {method.name === 'UPI' && form.isEnabled && (
                <div className="border-t-2 border-slate-100 pt-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">UPI ID</label>
                    <input
                      value={form.upiId}
                      onChange={e => update(method.id, 'upiId', e.target.value)}
                      placeholder="yourname@ybl"
                      className="w-full bg-white border-2 border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#34D399] font-semibold transition"
                    />
                    <p className="text-xs text-slate-500 mt-1.5 font-medium flex items-center gap-1.5">
                      <Settings size={12} className="text-slate-400" />
                      <span>Customers can use this ID to pay directly</span>
                    </p>
                  </div>
                  {form.upiId ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-white p-3 rounded-xl border-2 border-slate-800 shadow-pop-sm">
                        <QRCodeSVG value={`upi://pay?pa=${form.upiId}&pn=Cafe+POS`} size={120} />
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Live QR Preview</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-500 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl text-xs h-fit self-center">
                      <AlertTriangle size={16} />
                      <span>Enter UPI ID to generate live checkout QR code</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => handleSave(method)}
                  disabled={saving[method.id]}
                  className="bg-[#34D399] hover:bg-[#28b380] text-slate-900 border-2 border-slate-800 px-5 py-2.5 rounded-xl text-sm font-bold shadow-pop-sm hover:translate-y-[-2px] active:translate-y-[2px] transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>{saving[method.id] ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

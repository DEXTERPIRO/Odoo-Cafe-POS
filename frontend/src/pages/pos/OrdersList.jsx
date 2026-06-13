import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/SkeletonLoader';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Armchair, ShoppingBag, ClipboardList, Ticket,
  CheckCircle2, Edit3, Trash2, RefreshCw, ChevronDown,
  IndianRupee, ShoppingCart, ChefHat, XCircle, BellRing
} from 'lucide-react';

const BG     = '#FFFDF5';
const WHITE  = '#FFFFFF';
const FG     = '#1E293B';
const MUTED  = '#64748B';
const BORDER = '#E2E8F0';
const ACCENT = '#8B5CF6';
const AMBER  = '#FBBF24';
const EMERALD= '#34D399';
const PINK   = '#F472B6';
const FONT_H = "'Outfit', system-ui, sans-serif";
const FONT_B = "'Plus Jakarta Sans', system-ui, sans-serif";

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_CONFIG = {
  PAID:             { color: '#059669', bg: `${EMERALD}20`, border: `${EMERALD}60`, label: 'Paid',      accent: EMERALD },
  READY:            { color: '#7C3AED', bg: '#EDE9FE',      border: '#C4B5FD',      label: 'Ready ✓',  accent: '#8B5CF6' },
  SENT_TO_KITCHEN:  { color: '#2563EB', bg: '#EFF6FF',      border: '#BFDBFE',      label: 'Kitchen',   accent: '#60A5FA' },
  DRAFT:            { color: MUTED,     bg: '#F8FAFC',      border: BORDER,         label: 'Draft',     accent: MUTED },
  CANCELLED:        { color: '#DC2626', bg: '#FEF2F2',      border: '#FECACA',      label: 'Cancelled', accent: '#F87171' },
};

export default function OrdersList({ session }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = async () => {
    if (!session?.id) return;
    try {
      setLoading(true);
      const data = await api.get(`/orders?sessionId=${session.id}`);
      setOrders(data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [session?.id]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await api.put(`/orders/${cancelTarget}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setCancelLoading(false);
      setCancelTarget(null);
    }
  };

  const handleEditOrder = (order) => {
    const cartItems = order.lines.map(line => ({
      productId: line.productId,
      name: line.product.name,
      unitPrice: parseFloat(line.unitPrice),
      price: parseFloat(line.unitPrice),
      quantity: line.quantity,
      lineTotal: parseFloat(line.lineTotal),
      categoryColor: line.product.category?.color || ACCENT,
      color: line.product.category?.color || ACCENT,
    }));
    navigate('/pos', {
      state: {
        loadOrder: {
          id: order.id,
          orderNumber: order.orderNumber,
          tableId: order.tableId,
          table: order.table,
          customerId: order.customerId,
          customer: order.customer,
          couponCode: order.couponCode,
          cartItems,
        }
      }
    });
  };

  const statusOrder = { READY: 0, SENT_TO_KITCHEN: 1, DRAFT: 2, PAID: 3, CANCELLED: 4 };
  const sorted = [...orders].sort((a, b) =>
    (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) ||
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const revenue = orders.filter(o => o.status === 'PAID').reduce((s, o) => s + parseFloat(o.total || 0), 0);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: BG, fontFamily: FONT_B }}>

      {/* ── Header ── */}
      <div className="px-5 py-4 shrink-0 flex items-center justify-between"
           style={{ borderBottom: `2px solid ${BORDER}`, background: WHITE }}>
        <div>
          <h2 className="font-black text-xl" style={{ color: FG, fontFamily: FONT_H }}>Orders</h2>
          <p className="text-xs mt-0.5 font-semibold" style={{ color: MUTED }}>
            {session
              ? `Session started ${new Date(session.openedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
              : 'No active session'}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all duration-200 border-2"
          style={{ background: WHITE, color: MUTED, borderColor: BORDER, boxShadow: `2px 2px 0px 0px ${BORDER}` }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = FG; }}
          onMouseLeave={e => { e.currentTarget.style.background = WHITE; e.currentTarget.style.color = MUTED; }}
        >
          <RefreshCw size={14} strokeWidth={2.5} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Stats row ── */}
      {!loading && orders.length > 0 && (
        <div className="px-5 py-3 shrink-0 flex items-center gap-2 flex-wrap"
             style={{ borderBottom: `2px solid ${BORDER}`, background: WHITE }}>
          {[
            { label: 'Ready',    status: 'READY',           icon: BellRing },
            { label: 'Kitchen',  status: 'SENT_TO_KITCHEN', icon: ChefHat },
            { label: 'Draft',    status: 'DRAFT',           icon: ShoppingCart },
            { label: 'Paid',     status: 'PAID',            icon: CheckCircle2 },
            { label: 'Cancelled',status: 'CANCELLED',       icon: XCircle },
          ].map(({ label, status, icon: Icon }) => {
            const count = orders.filter(o => o.status === status).length;
            const cfg = STATUS_CONFIG[status];
            if (!count) return null;
            return (
              <div key={status}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2"
                style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
                <Icon size={12} strokeWidth={2.5} />
                {label}: {count}
              </div>
            );
          })}
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2"
               style={{ background: `${ACCENT}12`, borderColor: `${ACCENT}50`, color: '#6D28D9' }}>
            <IndianRupee size={12} strokeWidth={2.5} />
            Revenue: {fmt(revenue)}
          </div>
        </div>
      )}

      {/* ── Orders list ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4" style={{ background: BG }}>
        {loading ? (
          <TableSkeleton rows={6} />
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border-2"
                 style={{ background: WHITE, borderColor: BORDER, boxShadow: `4px 4px 0px 0px ${BORDER}` }}>
              <ClipboardList size={36} style={{ color: BORDER }} />
            </div>
            <div>
              <div className="font-bold text-base" style={{ color: MUTED, fontFamily: FONT_H }}>No orders this session yet</div>
              <div className="text-sm mt-1" style={{ color: '#CBD5E1' }}>Go to POS Order and start taking orders!</div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.DRAFT;
              const isExpanded = expanded === order.id;
              return (
                <div key={order.id}
                  className="rounded-xl overflow-hidden transition-all duration-200"
                  style={{ background: WHITE, border: `2px solid ${BORDER}`, boxShadow: `4px 4px 0px 0px ${BORDER}` }}>

                  {/* Main row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    style={{ borderLeft: `4px solid ${cfg.accent}` }}
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                  >
                    {/* Order # */}
                    <div className="font-black font-mono text-sm shrink-0" style={{ color: ACCENT, minWidth: 100 }}>
                      {order.orderNumber}
                    </div>

                    {/* Table / Takeaway */}
                    <div className="text-xs flex items-center gap-1 shrink-0 font-semibold" style={{ color: MUTED, minWidth: 80 }}>
                      {order.table ? (
                        <><Armchair size={12} strokeWidth={2.5} /> {order.table.tableNumber.toUpperCase()}</>
                      ) : (
                        <><ShoppingBag size={12} strokeWidth={2.5} /> Takeaway</>
                      )}
                    </div>

                    {/* Items + customer */}
                    <div className="flex-1 text-xs font-semibold" style={{ color: MUTED }}>
                      {order.lines?.length || 0} item{order.lines?.length !== 1 ? 's' : ''}
                      {order.customer && (
                        <span className="ml-2 hidden sm:inline" style={{ color: ACCENT }}>· {order.customer.name}</span>
                      )}
                    </div>

                    {/* Total */}
                    <div className="font-black text-sm shrink-0" style={{ color: ACCENT }}>
                      {fmt(order.total)}
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold border-2"
                        style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="text-xs shrink-0 font-semibold hidden sm:block" style={{ color: MUTED }}>
                      {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Expand arrow */}
                    <ChevronDown
                      size={14} strokeWidth={2.5}
                      className="transition-transform duration-200 shrink-0"
                      style={{ color: MUTED, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 py-3" style={{ borderTop: `2px solid ${BORDER}`, background: '#FAFAFA' }}>
                      {/* Line items */}
                      <div className="space-y-1.5 mb-3">
                        {order.lines?.map(l => (
                          <div key={l.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full shrink-0"
                                   style={{ background: l.product?.category?.color || ACCENT }} />
                              <span className="font-semibold" style={{ color: FG }}>{l.product?.name}</span>
                              <span className="text-xs" style={{ color: MUTED }}>× {l.quantity}</span>
                            </div>
                            <span className="font-bold" style={{ color: ACCENT }}>{fmt(l.lineTotal)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="space-y-1 text-xs pt-2" style={{ borderTop: `2px solid ${BORDER}` }}>
                        <div className="flex justify-between font-semibold" style={{ color: MUTED }}>
                          <span>Subtotal</span><span style={{ color: FG }}>{fmt(order.subtotal)}</span>
                        </div>
                        {parseFloat(order.discountAmount) > 0 && (
                          <div className="flex justify-between font-bold" style={{ color: '#059669' }}>
                            <span>Discount</span><span>−{fmt(order.discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold" style={{ color: MUTED }}>
                          <span>Tax (5%)</span><span style={{ color: FG }}>{fmt(order.taxAmount)}</span>
                        </div>
                        <div className="flex justify-between font-black text-sm pt-1 border-t-2" style={{ color: ACCENT, borderColor: BORDER }}>
                          <span>Total</span><span>{fmt(order.total)}</span>
                        </div>
                      </div>

                      {/* Payment info */}
                      {order.status === 'PAID' && (
                        <div className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-xl border-2 font-semibold"
                             style={{ background: `${EMERALD}15`, borderColor: `${EMERALD}60`, color: '#059669' }}>
                          <CheckCircle2 size={13} strokeWidth={2.5} />
                          <span>Paid via {order.paymentMethod}</span>
                          {order.couponCode && (
                            <span className="ml-2 flex items-center gap-1" style={{ color: ACCENT }}>
                              <Ticket size={11} strokeWidth={2.5} /> {order.couponCode}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      {order.status === 'READY' && (
                        <div className="flex gap-2 mt-3">
                          <div
                            className="flex-1 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-1.5 border-2"
                            style={{ background: '#EDE9FE', borderColor: '#C4B5FD', color: '#7C3AED' }}
                          >
                            <BellRing size={13} strokeWidth={2.5} /> Kitchen Complete — Proceed to Payment
                          </div>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-200 border-2"
                            style={{ background: ACCENT, color: '#fff', borderColor: FG, boxShadow: `3px 3px 0px 0px ${FG}` }}
                          >
                            <CheckCircle2 size={13} strokeWidth={2.5} /> Pay Now
                          </button>
                        </div>
                      )}
                      {(order.status === 'DRAFT' || order.status === 'SENT_TO_KITCHEN') && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all duration-200 flex items-center justify-center gap-1.5 border-2"
                            style={{ background: ACCENT, color: '#fff', borderColor: FG, boxShadow: `3px 3px 0px 0px ${FG}` }}
                          >
                            <Edit3 size={13} strokeWidth={2.5} /> Edit Order
                          </button>
                          <button
                            onClick={() => setCancelTarget(order.id)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all duration-200 flex items-center justify-center gap-1.5 border-2"
                            style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626', boxShadow: `3px 3px 0px 0px #FECACA` }}
                          >
                            <Trash2 size={13} strokeWidth={2.5} /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={cancelLoading}
        title="Cancel Order?"
        message="This order will be marked as cancelled and cannot be undone."
        confirmLabel="Cancel Order"
        confirmClass="bg-red-500 hover:bg-red-600"
      />
    </div>
  );
}

'use client';

import React, {
  createContext, useContext, useReducer, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { _get, _post, _put, _delete } from '@/shared/fetchwrapper';

// ── Types ──────────────────────────────────────────────────────────────────
export interface CartItem {
  id:            string | number;
  cartItemId?:   string;
  name:          string;
  price:         number;
  quantity:      number;
  product_count: number;
  is_available:  boolean;
  color?:        string;
  color_hex?:    string;
  image?:        string;
  originalPrice?: number;
  emoji?:         string;
  bgGradient?:    string;
  category?:      string;
  badge?:         string;
  backendId?:     number | string;
}

export interface AddItemInput {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  quantity?: number;
  image?: string;
  emoji?: string;
  bgGradient?: string;
  category?: string;
  color?: string;
  color_hex?: string;
  product_count?: number;
  is_available?: boolean;
}

type LineRef = { id: string | number; color?: string; cartItemId?: string };
type ActionResult = { ok: boolean; error?: string };

interface CartState {
  items:    CartItem[];
  total:    number;
  hydrated: boolean;
  status:   'loading' | 'ready' | 'error';
  authed:   boolean;
  error:    string | null;
  toast:    { message: string; kind: 'error' | 'success' } | null;
}

type CartAction =
  | { type: 'ADD_ITEM';        payload: CartItem }
  | { type: 'REMOVE_ITEM';     payload: { id: string | number; color?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string | number; color?: string; quantity: number } }
  | { type: 'RECONCILE_LINE';  payload: { id: string | number; color?: string; cartItemId?: string; quantity?: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE';         payload: { items: CartItem[]; authed: boolean } }
  | { type: 'SET_AUTHED';      payload: boolean }
  | { type: 'SET_STATUS';      payload: { status: CartState['status']; error?: string | null } }
  | { type: 'SET_TOAST';       payload: { message: string; kind: 'error' | 'success' } | null };

const initialState: CartState = {
  items: [], total: 0, hydrated: false, status: 'loading', authed: false, error: null, toast: null,
};

// ── Static helpers ───────────────────────────────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  Toys: '🧸', Vehicles: '🚲', 'Soft Toys': '🐻', Games: '🎮', Stationery: '✏️',
  'Arts & Crafts': '🎨', Books: '📚', 'Baby & Toddler': '🍼', Outdoor: '🛹', Bags: '🎒', default: '🎁',
};
const GRADIENTS = [
  'linear-gradient(135deg,#FFF3D4,#FFE099)', 'linear-gradient(135deg,#E1F7F2,#AAEEDD)',
  'linear-gradient(135deg,#EAE0FF,#C7A4F5)', 'linear-gradient(135deg,#E0F3FF,#AACFF5)',
  'linear-gradient(135deg,#E8FFEE,#AAEECC)', 'linear-gradient(135deg,#FFEEF8,#F5B6D6)',
];
function gradientFor(id: string | number) { return GRADIENTS[Number(id) % GRADIENTS.length]; }
function calcTotal(items: CartItem[]) { return items.reduce((s, i) => s + i.price * i.quantity, 0); }

/** Same product AND same color (or both none) = same cart line. */
function isSameLine(a: CartItem | LineRef, b: CartItem | LineRef): boolean {
  return String(a.id) === String(b.id) && ((a.color ?? '') === (b.color ?? ''));
}

/** Price precedence identical to ProductPage.mapProduct: amount wins, else percentage. */
function computeSalePrice(p: any): number {
  const orig = Number(p?.original_price ?? 0) || 0;
  const amt  = Number(p?.amount_discount ?? 0) || 0;
  const pct  = Number(p?.percentage_discount ?? 0) || 0;
  let price = orig;
  if (amt > 0)      price = orig - amt;
  else if (pct > 0) price = Math.round(orig - (orig * pct) / 100);
  if (!Number.isFinite(price) || price < 0) price = 0;
  return price;
}

function mapServerItems(data: any): CartItem[] {
  const rows: any[] = Array.isArray(data?.cart_items) ? data.cart_items : [];
  return rows.map((ci: any, idx: number) => {
    const product   = ci.product ?? {};
    const productId = product.id ?? ci.product_id ?? idx;
    const firstImg  = product.product_image?.[0];
    const itemImage =
      ci.image ||
      (firstImg && typeof firstImg === 'object' ? firstImg.url : (typeof firstImg === 'string' ? firstImg : '')) ||
      '';
    const colorSuffix = ci.color ? ` – ${ci.color}` : '';
    return {
      id:            productId,
      cartItemId:    ci.id != null ? String(ci.id) : undefined,
      backendId:     ci.id ?? undefined,
      name:          `${product.name ?? 'Product'}${colorSuffix}`,
      category:      product.category ?? 'General',
      price:         computeSalePrice(product),                 // ← respects percentage_discount
      originalPrice: Number(product.original_price ?? 0) || 0,
      quantity:      Math.max(1, Number(ci.quantity ?? 1) || 1),
      emoji:         CATEGORY_EMOJI[product.category ?? ''] ?? CATEGORY_EMOJI.default,
      bgGradient:    gradientFor(productId),
      product_count: Number(product.count ?? 0) || 0,
      is_available:  product.is_active ?? true,
      color:         ci.color ?? '',
      color_hex:     ci.color_hex ?? '',
      image:         itemImage,
    } satisfies CartItem;
  });
}

function statusOf(e: any): number | undefined { return e?.status ?? e?.response?.status; }
function messageFromError(e: any): string {
  return e?.detail || e?.message || 'Something went wrong. Please try again.';
}

// ── localStorage (persistence + guest layer) ─────────────────────────────────
const LS_KEY        = 'girnar_cart_v1';
const LS_GUEST_FLAG = 'girnar_cart_guest_pending';
function readLocal(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function writeLocal(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
}
function markGuestPending() {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LS_GUEST_FLAG, '1'); } catch {}
}

// ── Reducer ────────────────────────────────────────────────────────────────
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state, hydrated: true, status: 'ready', error: null,
        authed: action.payload.authed,
        items: action.payload.items, total: calcTotal(action.payload.items),
      };

    case 'ADD_ITEM': {
      const idx = state.items.findIndex((i) => isSameLine(i, action.payload));
      const qtyToAdd = Math.max(1, action.payload.quantity ?? 1);
      let items: CartItem[];
      if (idx !== -1) {
        items = state.items.map((item, i) =>
          i === idx
            ? {
                ...item,
                quantity: item.quantity + qtyToAdd,
                image:     action.payload.image     || item.image,
                color_hex: action.payload.color_hex || item.color_hex,
                product_count: action.payload.product_count ?? item.product_count,
                is_available:  action.payload.is_available  ?? item.is_available,
              }
            : item,
        );
      } else {
        items = [...state.items, { ...action.payload, quantity: qtyToAdd }];
      }
      return { ...state, items, total: calcTotal(items) };
    }

    case 'REMOVE_ITEM': {
      const items = state.items.filter((item) => !isSameLine(item, action.payload));
      return { ...state, items, total: calcTotal(items) };
    }

    case 'UPDATE_QUANTITY': {
      const q = Math.max(1, action.payload.quantity);
      const items = state.items.map((item) =>
        isSameLine(item, action.payload) ? { ...item, quantity: q } : item,
      );
      return { ...state, items, total: calcTotal(items) };
    }

    case 'RECONCILE_LINE': {
      const { cartItemId, quantity } = action.payload;
      const items = state.items.map((item) =>
        isSameLine(item, action.payload)
          ? {
              ...item,
              cartItemId: cartItemId ?? item.cartItemId,
              backendId:  cartItemId ?? item.backendId,
              quantity:   typeof quantity === 'number' ? Math.max(1, quantity) : item.quantity,
            }
          : item,
      );
      return { ...state, items, total: calcTotal(items) };
    }

    case 'SET_AUTHED': return { ...state, authed: action.payload };
    case 'SET_STATUS': return { ...state, status: action.payload.status, error: action.payload.error ?? null, hydrated: true };
    case 'SET_TOAST':  return { ...state, toast: action.payload };
    case 'CLEAR_CART': return { ...initialState, hydrated: true, status: 'ready', authed: state.authed };
    default:           return state;
  }
}

// ── Context value ────────────────────────────────────────────────────────────
interface CartContextValue {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;        // kept for backward compatibility
  addItem: (input: AddItemInput) => Promise<ActionResult>;
  updateQuantity: (ref: LineRef, quantity: number) => void;
  removeItem: (ref: LineRef) => void;
  refresh: () => Promise<void>;
  pushToast: (message: string, kind?: 'error' | 'success') => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────
async function mergeLocalIntoServer(local: CartItem[]) {
  for (const it of local) {
    try {
      await _post('/api/cart/items', {
        product_id: it.id,
        quantity:   Math.max(1, it.quantity),
        color:      it.color || undefined,
        color_hex:  it.color_hex || undefined,
        image:      it.image || undefined,
      });
    } catch { /* best-effort merge */ }
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const loadedRef   = useRef(false);
  const itemsRef    = useRef(state.items);
  const authedRef   = useRef(state.authed);
  const hydratedRef = useRef(state.hydrated);
  const putTimers   = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const toastTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { itemsRef.current  = state.items;    }, [state.items]);
  useEffect(() => { authedRef.current = state.authed;   }, [state.authed]);
  useEffect(() => { hydratedRef.current = state.hydrated; }, [state.hydrated]);

  // Persist to localStorage on every change once we've loaded.
  useEffect(() => { if (state.hydrated) writeLocal(state.items); }, [state.items, state.hydrated]);

  const pushToast = useCallback((message: string, kind: 'error' | 'success' = 'error') => {
    dispatch({ type: 'SET_TOAST', payload: message ? { message, kind } : null });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (message) toastTimer.current = setTimeout(() => dispatch({ type: 'SET_TOAST', payload: null }), 3200);
  }, []);

  const loadCart = useCallback(async () => {
    const local = readLocal();
    try {
      const data = await _get('/api/cart');                // authenticated path (token via wrapper)
      let serverItems = mapServerItems(data);

      const guestPending = typeof window !== 'undefined' && localStorage.getItem(LS_GUEST_FLAG) === '1';
      if (guestPending && local.length > 0) {
        await mergeLocalIntoServer(local);                 // merge once, only after a guest→login transition
        try { serverItems = mapServerItems(await _get('/api/cart')); } catch {}
        try { localStorage.removeItem(LS_GUEST_FLAG); } catch {}
      }
      dispatch({ type: 'HYDRATE', payload: { items: serverItems, authed: true } });
    } catch (e: any) {
      const code = statusOf(e);
      if (code === 401 || code === 403) {
        dispatch({ type: 'HYDRATE', payload: { items: local, authed: false } });   // guest mode
      } else if (local.length > 0) {
        dispatch({ type: 'HYDRATE', payload: { items: local, authed: false } });   // degrade gracefully
      } else {
        dispatch({ type: 'SET_STATUS', payload: { status: 'error', error: messageFromError(e) } });
      }
    }
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadCart();
  }, [loadCart]);

  const addItem = useCallback(async (input: AddItemInput): Promise<ActionResult> => {
    // Still resolving auth state — do nothing yet
    if (!hydratedRef.current) return { ok: false, error: 'loading' };

    // Not logged in → redirect to login with current page as callback
    if (!authedRef.current) {
      if (typeof window !== 'undefined') {
        const cb = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?callbackUrl=${cb}`;
      }
      return { ok: false, error: 'login_required' };
    }

    const color = input.color ?? '';
    const payload: CartItem = {
      id: input.id,
      name: input.name,
      price: input.price,
      originalPrice: input.originalPrice ?? input.price,
      quantity: Math.max(1, input.quantity ?? 1),
      color,
      color_hex: input.color_hex ?? '',
      image: input.image ?? '',
      emoji: input.emoji ?? (CATEGORY_EMOJI[input.category ?? ''] ?? CATEGORY_EMOJI.default),
      bgGradient: input.bgGradient ?? gradientFor(input.id),
      category: input.category ?? '',
      product_count: input.product_count ?? 0,
      is_available: input.is_available ?? true,
    };

    const prev = itemsRef.current.find((i) => isSameLine(i, payload));
    const prevQty = prev?.quantity ?? 0;

    dispatch({ type: 'ADD_ITEM', payload });               // optimistic

    try {
      const res: any = await _post('/api/cart/items', {
        product_id: input.id,
        quantity: payload.quantity,
        color: color || undefined,
        color_hex: input.color_hex || undefined,
        image: input.image || undefined,
      });
      if (res && (res.id != null || typeof res.quantity === 'number')) {
        dispatch({
          type: 'RECONCILE_LINE',
          payload: {
            id: input.id, color,
            cartItemId: res.id != null ? String(res.id) : undefined,
            quantity: typeof res.quantity === 'number' ? res.quantity : undefined,
          },
        });
      }
      return { ok: true };
    } catch (e: any) {
      if (statusOf(e) === 401) {
        // Token expired mid-session → redirect to login
        dispatch({ type: 'SET_AUTHED', payload: false });
        if (typeof window !== 'undefined') {
          const cb = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?callbackUrl=${cb}`;
        }
        return { ok: false, error: 'login_required' };
      }
      // Real failure (e.g. out of stock) → accurate rollback
      if (prevQty > 0) dispatch({ type: 'UPDATE_QUANTITY', payload: { id: input.id, color, quantity: prevQty } });
      else             dispatch({ type: 'REMOVE_ITEM',     payload: { id: input.id, color } });
      return { ok: false, error: messageFromError(e) };
    }
  }, []);

  const updateQuantity = useCallback((ref: LineRef, desired: number) => {
    const cur = itemsRef.current.find((i) => isSameLine(i, ref));
    if (!cur) return;
    const max = cur.product_count && cur.product_count > 0 ? cur.product_count : 99;
    const q = Math.min(max, Math.max(1, desired));
    if (q === cur.quantity) return;
    const color = cur.color ?? '';

    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: ref.id, color, quantity: q } });  // optimistic

    if (!authedRef.current) { markGuestPending(); return; }

    const rowId = cur.cartItemId ?? ref.cartItemId ?? (cur.backendId != null ? String(cur.backendId) : undefined);
    if (!rowId) return;                                    // not yet on server; refresh-on-mount resolves it

    if (putTimers.current[rowId]) clearTimeout(putTimers.current[rowId]);
    putTimers.current[rowId] = setTimeout(async () => {
      try {
        await _put(`/api/cart/items/${rowId}`, { quantity: q });
      } catch (e: any) {
        if (statusOf(e) === 401) { dispatch({ type: 'SET_AUTHED', payload: false }); markGuestPending(); return; }
        pushToast(messageFromError(e), 'error');
        loadCart();                                        // resync to authoritative server state
      }
    }, 350);
  }, [loadCart, pushToast]);

  const removeItem = useCallback((ref: LineRef) => {
    const cur = itemsRef.current.find((i) => isSameLine(i, ref));
    if (!cur) return;
    const color = cur.color ?? '';

    dispatch({ type: 'REMOVE_ITEM', payload: { id: ref.id, color } });   // optimistic

    if (!authedRef.current) { markGuestPending(); return; }

    const rowId = cur.cartItemId ?? ref.cartItemId ?? (cur.backendId != null ? String(cur.backendId) : undefined);
    if (!rowId) return;

    _delete(`/api/cart/items/${rowId}`).catch((e: any) => {
      if (statusOf(e) === 401) { dispatch({ type: 'SET_AUTHED', payload: false }); markGuestPending(); return; }
      pushToast(messageFromError(e), 'error');
      loadCart();                                          // restores the line from server truth
    });
  }, [loadCart, pushToast]);

  const value = useMemo<CartContextValue>(
    () => ({ state, dispatch, addItem, updateQuantity, removeItem, refresh: loadCart, pushToast }),
    [state, addItem, updateQuantity, removeItem, loadCart, pushToast],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
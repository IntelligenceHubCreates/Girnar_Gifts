'use client';

import React, {
  createContext, useContext, useReducer, useEffect, useRef,
} from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CartItem {
  id:            string | number;   // product ID
  cartItemId?:   string;            // backend cart_item row ID (used for delete/update)
  name:          string;
  price:         number;
  quantity:      number;
  product_count: number;
  is_available:  boolean;

  // Color variant — set when user picks a specific color on the product page
  color?:        string;            // e.g. "Pink"
  color_hex?:    string;            // e.g. "#F4A7B9"  — shown as swatch dot
  image?:        string;            // color-specific image URL

  // Display helpers
  originalPrice?: number;
  emoji?:         string;
  bgGradient?:    string;
  category?:      string;
  badge?:         string;

  // Legacy field kept for backward compatibility
  backendId?:     number | string;
}

interface CartState {
  items:    CartItem[];
  total:    number;
  hydrated: boolean;     // true once backend load completes
}

type CartAction =
  | { type: 'ADD_ITEM';        payload: CartItem }
  | { type: 'REMOVE_ITEM';     payload: { id: string | number; color?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string | number; color?: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE';         payload: CartItem[] };

const initialState: CartState = { items: [], total: 0, hydrated: false };

// ── Helpers ────────────────────────────────────────────────────────────────

function calcTotal(items: CartItem[]) {
  return items.reduce((s, i) => s + i.price * i.quantity, 0);
}

/**
 * Two cart items are the "same line" when they have the same product ID
 * AND the same color (or both have no color).
 * This means Pink Jelly Bag and Orange Jelly Bag are separate line items.
 */
function isSameLine(a: CartItem, b: CartItem): boolean {
  const sameProduct = String(a.id) === String(b.id);
  const sameColor   = (a.color ?? '') === (b.color ?? '');
  return sameProduct && sameColor;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Toys:           '🧸',
  Vehicles:       '🚲',
  'Soft Toys':    '🐻',
  Games:          '🎮',
  Stationery:     '✏️',
  'Arts & Crafts':'🎨',
  Books:          '📚',
  'Baby & Toddler':'🍼',
  Outdoor:        '🛹',
  Bags:           '🎒',
  default:        '🎁',
};

const GRADIENTS = [
  'linear-gradient(135deg,#FFF3D4,#FFE099)',
  'linear-gradient(135deg,#E1F7F2,#AAEEDD)',
  'linear-gradient(135deg,#EAE0FF,#C7A4F5)',
  'linear-gradient(135deg,#E0F3FF,#AACFF5)',
  'linear-gradient(135deg,#E8FFEE,#AAEECC)',
  'linear-gradient(135deg,#FFEEF8,#F5B6D6)',
];

function gradientFor(id: string | number) {
  return GRADIENTS[Number(id) % GRADIENTS.length];
}

// ── Reducer ────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {

    // ── HYDRATE: load items from backend on app start ──────────────
    case 'HYDRATE': {
      return {
        hydrated: true,
        items:    action.payload,
        total:    calcTotal(action.payload),
      };
    }

    // ── ADD_ITEM: merge by product+color, not just product ─────────
    case 'ADD_ITEM': {
      const existingIdx = state.items.findIndex((i) =>
        isSameLine(i, action.payload)
      );

      let items: CartItem[];

      if (existingIdx !== -1) {
        // Same product + same color → increment quantity
        items = state.items.map((item, idx) =>
          idx === existingIdx
            ? {
                ...item,
                quantity: item.quantity + (action.payload.quantity ?? 1),
                // Update image in case a fresher URL was passed
                image:    action.payload.image    || item.image,
                color_hex:action.payload.color_hex || item.color_hex,
              }
            : item
        );
      } else {
        // New line item (different product OR different color)
        items = [...state.items, action.payload];
      }

      return { ...state, items, total: calcTotal(items) };
    }

    // ── REMOVE_ITEM: match by product+color ────────────────────────
    case 'REMOVE_ITEM': {
      const { id, color } = action.payload;
      const items = state.items.filter((item) => {
        const sameProduct = String(item.id) === String(id);
        const sameColor   = (item.color ?? '') === (color ?? '');
        // Remove only if BOTH product and color match
        return !(sameProduct && sameColor);
      });
      return { ...state, items, total: calcTotal(items) };
    }

    // ── UPDATE_QUANTITY: match by product+color ────────────────────
    case 'UPDATE_QUANTITY': {
      const { id, color, quantity } = action.payload;
      const items = state.items.map((item) => {
        const sameProduct = String(item.id) === String(id);
        const sameColor   = (item.color ?? '') === (color ?? '');
        return sameProduct && sameColor
          ? { ...item, quantity }
          : item;
      });
      return { ...state, items, total: calcTotal(items) };
    }

    case 'CLEAR_CART':
      return { ...initialState, hydrated: true };

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────

const CartContext = createContext<
  { state: CartState; dispatch: React.Dispatch<CartAction> } | undefined
>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Fetch only once; guard against React StrictMode double-invoke
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch('/api/cart', {
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data: any) => {
        const items: CartItem[] = (data?.cart_items ?? []).map(
          (ci: any, idx: number) => {
            const product   = ci.product ?? {};
            const productId = product.id ?? ci.product_id ?? idx;

            // ── Use color-specific image if available ──────────────
            // Backend now returns ci.image (the color variant image URL).
            // Fall back to the product's default image if not set.
            const itemImage =
              ci.image ||
              product.product_image?.[0]?.url ||
              '';

            // ── Display name: include color if set ─────────────────
            // "Jelly Backpack – Pink" so user sees it clearly in cart
            const colorSuffix = ci.color ? ` – ${ci.color}` : '';
            const displayName = `${product.name ?? 'Product'}${colorSuffix}`;

            return {
              id:            productId,
              cartItemId:    String(ci.id ?? ''),      // backend row ID for PUT/DELETE
              backendId:     ci.id ?? null,
              name:          displayName,
              category:      product.category ?? 'General',
              price:         (product.original_price ?? 0) - (product.amount_discount ?? 0),
              originalPrice: product.original_price ?? 0,
              quantity:      ci.quantity ?? 1,
              emoji:         CATEGORY_EMOJI[product.category ?? ''] ?? CATEGORY_EMOJI.default,
              bgGradient:    gradientFor(productId),
              product_count: product.count      ?? 0,
              is_available:  product.is_active  ?? true,

              // ── Color fields from backend ──────────────────────────
              color:     ci.color     ?? '',
              color_hex: ci.color_hex ?? '',
              image:     itemImage,
            } satisfies CartItem;
          }
        );

        dispatch({ type: 'HYDRATE', payload: items });
      })
      .catch(() => {
        // Not logged in or network error — hydrate with empty cart
        dispatch({ type: 'HYDRATE', payload: [] });
      });
  }, []);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
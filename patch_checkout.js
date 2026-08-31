const fs = require('fs');
const file = 'C:/Users/ff0594/Documents/LA ESQUINA 51/la-esquina-51/src/app/(store)/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states
const stateAddition = `
  // Coupon States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount_amount: number} | null>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('id, code, discount_amount')
        .eq('code', couponInput.trim().toUpperCase())
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();
        
      if (error || !data) {
        setCouponError('Cupón inválido, expirado o ya utilizado.');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: data.code, discount_amount: Number(data.discount_amount) });
        setCouponInput('');
      }
    } catch (err) {
      setCouponError('Error al validar el cupón.');
    } finally {
      setValidatingCoupon(false);
    }
  };
`;

content = content.replace('const [bizumPhone, setBizumPhone] = useState(', stateAddition + '\n  const [bizumPhone, setBizumPhone] = useState(');

// 2. Update Total Calculation
content = content.replace(
  'const total = subtotal + DELIVERY_FEE;',
  'const total = Math.max(0, subtotal + DELIVERY_FEE - (appliedCoupon?.discount_amount || 0));'
);

// 3. Update Payload
content = content.replace(
  'subtotal,',
  'subtotal,\n        coupon_code: appliedCoupon?.code,'
);

// 4. Add UI
const uiAddition = `
        {/* Seccion Cupones */}
        <section className="p-6 rounded-2xl border space-y-4 shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
          <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2 border-b pb-2" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418', borderColor: '#E8D5A8' }}>
            <Tag size={20} className="text-[#A94F2F]" /> Cupón de Descuento
          </h2>
          
          {!appliedCoupon ? (
            <div className="space-y-2">
              <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#65513F' }}>Si tienes un cupón de descuento, colócalo aquí</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="CÓDIGO"
                  className="flex-1 p-3 rounded-xl font-mono text-sm focus:outline-none uppercase"
                  style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponInput.trim()}
                  className="px-4 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                  style={{ backgroundColor: '#3A2418', color: '#FFF7E5' }}
                >
                  {validatingCoupon ? '...' : 'Aplicar'}
                </button>
              </div>
              {couponError && <p className="text-xs font-medium text-red-600 font-mono mt-1">{couponError}</p>}
            </div>
          ) : (
            <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#E3F2E1', border: '1px dashed #4CAF50' }}>
              <div>
                <p className="text-sm font-bold text-green-800">¡Cupón Aplicado!</p>
                <p className="text-xs font-mono text-green-700">{appliedCoupon.code} (-{formatPrice(appliedCoupon.discount_amount)})</p>
              </div>
              <button 
                type="button"
                onClick={() => setAppliedCoupon(null)}
                className="text-xs font-bold text-red-600 uppercase hover:underline"
              >
                Quitar
              </button>
            </div>
          )}
        </section>
`;

content = content.replace('{/* Resumen del Pedido */}', uiAddition + '\n        {/* Resumen del Pedido */}');

// 5. Update UI Resumen to show discount
const discountUI = `
              {appliedCoupon && (
                <div className="flex justify-between font-bold" style={{ color: '#4CAF50' }}>
                  <span>Descuento Cupón:</span>
                  <span className="font-mono font-bold">-{formatPrice(appliedCoupon.discount_amount)}</span>
                </div>
              )}
`;

content = content.replace('<span>Gastos de envío:</span>', '<span>Gastos de envío:</span>'); // Need exact text which has special chars.
// It's Gastos de envo
const findText = `Gastos de env\\u00edo:</span>\\s*<span className="font-mono font-bold" style={{ color: '#3A2418' }}>\\{formatPrice\\(DELIVERY_FEE\\)\\}</span>\\s*</div>`;
// Actually, let's just use string replace on standard text if it works, or regex.
// I'll replace `{formatPrice(DELIVERY_FEE)}</span>\n              </div>`
content = content.replace(
  `{formatPrice(DELIVERY_FEE)}</span>\n              </div>`,
  `{formatPrice(DELIVERY_FEE)}</span>\n              </div>` + discountUI
);

// 6. Ensure Tag is imported
if (!content.includes('import {') || !content.includes('Tag')) {
    content = content.replace('UserCircle } from \'lucide-react\';', 'UserCircle, Tag } from \'lucide-react\';');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched checkout/page.tsx');

import { ProductScreen as ElectricianProductScreen } from '@/features/electrician/screens/ProductScreen';
import type { Screen } from '@/shared/types/navigation';

export function ProductScreen({
  onNavigate,
  onAddToCart,
  onBuyNow,
  onLoginRequired,
  initialCategory,
  cartCount = 0,
}: {
  onNavigate: (screen: Screen) => void;
  onAddToCart?: (item: any) => void;
  onBuyNow?: (item: any) => void;
  onLoginRequired?: () => void;
  initialCategory?: string;
  cartCount?: number;
}) {
  return <ElectricianProductScreen onNavigate={onNavigate} onAddToCart={onAddToCart} onBuyNow={onBuyNow} onLoginRequired={onLoginRequired} initialCategory={initialCategory} cartCount={cartCount} role="dealer" />;
}

import { ProductScreen as ElectricianProductScreen } from '@/features/electrician/screens/ProductScreen';
import type { Screen } from '@/shared/types/navigation';

export function ProductScreen({
  onNavigate,
  onAddToCart,
  onBuyNow,
  initialCategory,
}: {
  onNavigate: (screen: Screen) => void;
  onAddToCart?: (item: any) => void;
  onBuyNow?: (item: any) => void;
  initialCategory?: string;
}) {
  return <ElectricianProductScreen onNavigate={onNavigate} onAddToCart={onAddToCart} onBuyNow={onBuyNow} initialCategory={initialCategory} role="counterboy" showBottomBanner={false} />;
}

import { ProductScreen as ElectricianProductScreen } from '@/features/electrician/screens/ProductScreen';
import type { Screen } from '@/shared/types/navigation';

export function CategoriesScreen({
  onNavigate,
  onAddToCart,
  onBuyNow,
  initialCategory = 'all',
}: {
  onNavigate: (screen: Screen) => void;
  onAddToCart?: (item: any) => void;
  onBuyNow?: (item: any) => void;
  initialCategory?: string;
}) {
  return (
    <ElectricianProductScreen
      onNavigate={onNavigate}
      onAddToCart={onAddToCart}
      onBuyNow={onBuyNow}
      initialCategory={initialCategory}
      showBottomBanner={true}
      role="customer"
    />
  );
}

import { ProductScreen as ElectricianProductScreen } from '@/features/electrician/screens/ProductScreen';
import type { Screen } from '@/shared/types/navigation';

export function CategoriesScreen({
  onNavigate,
  onAddToCart,
  onBuyNow,
  onLoginRequired,
  initialCategory = 'all',
}: {
  onNavigate: (screen: Screen) => void;
  onAddToCart?: (item: any) => void;
  onBuyNow?: (item: any) => void;
  onLoginRequired?: () => void;
  initialCategory?: string;
}) {
  return (
    <ElectricianProductScreen
      onNavigate={onNavigate}
      onAddToCart={onAddToCart}
      onBuyNow={onBuyNow}
      onLoginRequired={onLoginRequired}
      initialCategory={initialCategory}
      showBottomBanner={true}
      role="customer"
    />
  );
}

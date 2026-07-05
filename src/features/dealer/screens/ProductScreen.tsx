import { ProductScreen as ElectricianProductScreen } from '@/features/electrician/screens/ProductScreen';
import type { Screen } from '@/shared/types/navigation';

export function ProductScreen({
  onNavigate,
  initialCategory,
  cartCount = 0,
}: {
  onNavigate: (screen: Screen) => void;
  initialCategory?: string;
  cartCount?: number;
}) {
  return <ElectricianProductScreen onNavigate={onNavigate} initialCategory={initialCategory} cartCount={cartCount} role="dealer" />;
}

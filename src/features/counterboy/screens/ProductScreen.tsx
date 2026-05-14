import { ProductScreen as ElectricianProductScreen } from '@/features/electrician/screens/ProductScreen';
import type { Screen } from '@/shared/types/navigation';

export function ProductScreen({
  onNavigate,
  initialCategory,
}: {
  onNavigate: (screen: Screen) => void;
  initialCategory?: string;
}) {
  return <ElectricianProductScreen onNavigate={onNavigate} initialCategory={initialCategory} role="counterboy" showBottomBanner={false} />;
}

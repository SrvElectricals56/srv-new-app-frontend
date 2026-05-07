import { ProductScreen as ElectricianProductScreen } from '@/features/electrician/screens/ProductScreen';
import type { Screen } from '@/shared/types/navigation';

export function ProductScreen({
  onNavigate,
}: {
  onNavigate: (screen: Screen) => void;
  initialCategory?: string;
}) {
  const handleNavigate = (screen: any) => {
    onNavigate(screen === 'scan' ? 'electricians' : screen);
  };

  return <ElectricianProductScreen onNavigate={handleNavigate} theme="dealer" />;
}

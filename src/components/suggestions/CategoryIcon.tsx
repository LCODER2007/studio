import type { SuggestionCategory } from "@/lib/types";
import { BookOpen, Server, PenTool, Leaf, Users, MoreHorizontal, LucideProps } from "lucide-react";

interface CategoryIconProps extends LucideProps {
  category: SuggestionCategory;
}

const iconMap: Record<SuggestionCategory, React.ElementType> = {
  ACADEMIC_CURRICULUM: BookOpen,
  INFRASTRUCTURE_IT: Server,
  TECHNICAL_DESIGN: PenTool,
  ENVIRONMENTAL_SUSTAINABILITY: Leaf,
  ADMINISTRATIVE_SEES: Users,
  OTHER: MoreHorizontal,
};

export const CategoryIcon = ({ category, ...props }: CategoryIconProps) => {
  const IconComponent = iconMap[category];
  return <IconComponent {...props} />;
};

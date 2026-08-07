import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

export const CategoryCard = ({ icon: Icon, title, description, onClick }: CategoryCardProps) => {
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer bg-card hover:shadow-medium transition-all duration-300 border border-border hover:border-primary/30 p-6"
    >
      <div className="flex flex-col items-start gap-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
};

import { Badge } from '@/components/ui/badge';
import { Post, Category } from '@/types/blog';

interface BlogSidebarProps {
    categories: Category[];
    selectedCategory?: string | null;
    onCategoryClick?: (categoryId: string | null) => void;
    stats?: {
        totalPosts: number;
        categoriesCount: number;
    };
    className?: string;
}

export default function BlogSidebar({
    categories,
    selectedCategory,
    onCategoryClick,
    stats,
    className = ""
}: BlogSidebarProps) {
    return (
        <aside className={`content-visibility-auto ${className}`}>
            <div className="sticky top-20 space-y-6">
                {/* Categories - Desktop Only */}
                <div className="hidden lg:block gradient-card border border-border/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                        <Badge
                            variant={selectedCategory === null ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => onCategoryClick?.(null)}
                        >
                            All
                        </Badge>
                        {categories.map((category) => (
                            <Badge
                                key={category.id}
                                variant={selectedCategory === category.id ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => onCategoryClick?.(category.id)}
                            >
                                {category.name}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="gradient-card border border-border/50 rounded-lg p-4">
                        <h3 className="font-semibold mb-4">Stats</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Posts</span>
                                <span className="font-medium">{stats.totalPosts}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Categories</span>
                                <span className="font-medium">{stats.categoriesCount}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

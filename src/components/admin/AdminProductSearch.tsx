import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface AdminProductSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  categories?: Array<{ id: string; name: string }>;
  totalProducts: number;
  filteredProducts: number;
  onClearFilters: () => void;
}

const AdminProductSearch: React.FC<AdminProductSearchProps> = ({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  categories = [],
  totalProducts,
  filteredProducts,
  onClearFilters
}) => {
  const hasActiveFilters = searchTerm || categoryFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="mb-6 space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search products by name, description, or category... (Ctrl+K)"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Category
          </Label>
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Actions</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex-1"
            >
              Clear Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSearchChange('pizza')}
              className="flex-1"
            >
              🍕 Pizzas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSearchChange('bevande')}
              className="flex-1"
            >
              🥤 Drinks
            </Button>
          </div>
        </div>
      </div>

      {/* Search Results Info */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <Search className="h-4 w-4" />
            <span className="text-sm font-medium">
              {filteredProducts === 0 ? (
                'No products match your filters'
              ) : (
                `Showing ${filteredProducts} of ${totalProducts} products`
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {searchTerm && (
              <Badge variant="secondary" className="text-xs">
                Search: "{searchTerm}"
              </Badge>
            )}
            {categoryFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Category: {categories.find(c => c.id === categoryFilter)?.name || categoryFilter}
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Status: {statusFilter}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="text-xs text-gray-500 flex items-center gap-4">
        <span>💡 Tips:</span>
        <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+K</kbd> to focus search</span>
        <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> to clear search</span>
      </div>
    </div>
  );
};

export default AdminProductSearch;

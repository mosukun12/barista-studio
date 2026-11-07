import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Edit3, Copy, Trash2, Archive } from 'lucide-react';
import { Recipe } from '../../types';
import { StatusBadge } from '../common/Badge';
import { DRINK_TYPE_CONFIG, formatDate } from '../../lib/utils';

interface RecipeTableRowProps {
  recipe: Recipe;
  onDuplicate: (id: string) => void;
  onArchive: (id: string, currentState: boolean) => void;
  onDelete: (id: string) => void;
}

export const RecipeTableRow: React.FC<RecipeTableRowProps> = ({
  recipe,
  onDuplicate,
  onArchive,
  onDelete,
}) => {
  const navigate = useNavigate();
  const drinkConfig = recipe.drink_type ? DRINK_TYPE_CONFIG[recipe.drink_type] : null;

  return (
    <tr
      onClick={() => navigate(`/recipes/${recipe.id}`)}
      className="group hover:bg-cafe-cream/50 dark:hover:bg-cafe-darkCard/60 cursor-pointer border-b border-cafe-border/60 dark:border-cafe-darkBorder transition-colors text-sm"
    >
      {/* Thumbnail */}
      <td className="py-3 px-4 w-14">
        <div className="w-10 h-10 rounded-xl bg-cafe-cream dark:bg-cafe-darkSurface overflow-hidden border border-cafe-border/60 dark:border-cafe-darkBorder flex items-center justify-center">
          {recipe.cover_image_url ? (
            <img src={recipe.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Coffee className="w-5 h-5 text-cafe-brass" />
          )}
        </div>
      </td>

      {/* Title */}
      <td className="py-3 px-4">
        <div className="font-semibold text-cafe-text dark:text-cafe-cream group-hover:text-cafe-copper transition-colors">
          {recipe.name_th}
        </div>
        {recipe.name_en && (
          <div className="text-xs text-cafe-muted font-mono">{recipe.name_en}</div>
        )}
      </td>

      {/* Category */}
      <td className="py-3 px-4 text-xs text-cafe-muted">
        {recipe.category_name || '-'}
      </td>

      {/* Drink Type & Cup */}
      <td className="py-3 px-4 text-xs">
        <div className="flex items-center gap-1.5 text-cafe-text dark:text-stone-300">
          <span>{drinkConfig?.icon}</span>
          <span>{recipe.glass_size || '-'}</span>
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <StatusBadge status={recipe.status} size="sm" />
      </td>

      {/* Composition */}
      <td className="py-3 px-4 text-xs text-cafe-muted font-mono">
        {recipe.ingredients?.length || 0} วัตถุดิบ / {recipe.steps?.length || 0} ขั้นตอน
      </td>

      {/* Last Updated */}
      <td className="py-3 px-4 text-xs text-cafe-muted font-mono">
        {formatDate(recipe.updated_at)}
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
            title="แก้ไขสูตร"
            className="p-1.5 text-cafe-muted hover:text-cafe-copper rounded-lg hover:bg-cafe-cream dark:hover:bg-cafe-darkBorder transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDuplicate(recipe.id)}
            title="ทำสำเนา"
            className="p-1.5 text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream rounded-lg hover:bg-cafe-cream dark:hover:bg-cafe-darkBorder transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onArchive(recipe.id, recipe.is_archived)}
            title={recipe.is_archived ? 'เลิกเก็บถาวร' : 'เก็บถาวร'}
            className="p-1.5 text-cafe-muted hover:text-amber-600 rounded-lg hover:bg-cafe-cream dark:hover:bg-cafe-darkBorder transition-colors"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(recipe.id)}
            title="ลบสูตร"
            className="p-1.5 text-cafe-muted hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Coffee, Copy, Trash2, Archive, Edit3, MoreVertical, Layers, Users } from 'lucide-react';
import { Recipe } from '../../types';
import { StatusBadge } from '../common/Badge';
import { DRINK_TYPE_CONFIG, formatDuration, formatDate } from '../../lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  onDuplicate: (id: string) => void;
  onArchive: (id: string, currentState: boolean) => void;
  onDelete: (id: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onDuplicate,
  onArchive,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);

  const drinkConfig = recipe.drink_type ? DRINK_TYPE_CONFIG[recipe.drink_type] : null;

  return (
    <div
      onClick={() => navigate(`/recipes/${recipe.id}`)}
      className="group relative flex flex-col bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder hover:border-cafe-copper/50 dark:hover:border-cafe-copper/50 shadow-cafe-subtle hover:shadow-cafe-card transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Cover image or atmospheric barista pattern */}
      <div className="relative h-44 w-full bg-cafe-cream dark:bg-cafe-darkSurface overflow-hidden">
        {recipe.cover_image_url ? (
          <img
            src={recipe.cover_image_url}
            alt={recipe.name_th}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cafe-cream via-cafe-sand/40 to-cafe-cream/80 dark:from-cafe-darkSurface dark:to-cafe-darkCard text-cafe-muted/60">
            <Coffee className="w-10 h-10 mb-1 stroke-1 text-cafe-brass/70" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-cafe-muted">
              {recipe.glass_size || 'Standard Cup'}
            </span>
          </div>
        )}

        {/* Top badges overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <StatusBadge status={recipe.status} size="sm" />
          {drinkConfig && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-black/55 backdrop-blur-md text-white shadow-xs">
              {drinkConfig.icon} {drinkConfig.label.split(' ')[0]}
            </span>
          )}
        </div>

        {/* Menu button */}
        <div
          className="absolute top-3 right-3 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1.5 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md text-cafe-text dark:text-cafe-cream hover:bg-white dark:hover:bg-black transition-colors shadow-xs"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-cafe-surface dark:bg-cafe-darkSurface rounded-xl border border-cafe-border dark:border-cafe-darkBorder shadow-lg dark:shadow-none py-1 z-40 text-xs">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate(`/recipes/${recipe.id}/edit`);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-cafe-text dark:text-cafe-cream hover:bg-cafe-cream dark:hover:bg-cafe-darkCard text-left"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cafe-copper" />
                  แก้ไขสูตร (Edit)
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate(recipe.id);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-cafe-text dark:text-cafe-cream hover:bg-cafe-cream dark:hover:bg-cafe-darkCard text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-cafe-muted" />
                  ทำสำเนา (Duplicate)
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onArchive(recipe.id, recipe.is_archived);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-cafe-text dark:text-cafe-cream hover:bg-cafe-cream dark:hover:bg-cafe-darkCard text-left"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-600" />
                  {recipe.is_archived ? 'เลิกเก็บถาวร' : 'เก็บถาวร (Archive)'}
                </button>
                <div className="my-1 border-t border-cafe-border/60 dark:border-cafe-darkBorder" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(recipe.id);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบสูตร (Delete)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Thai and English name */}
          <div className="mb-2">
            <h3 className="font-bold text-base text-cafe-text dark:text-cafe-cream group-hover:text-cafe-copper transition-colors line-clamp-1">
              {recipe.name_th}
            </h3>
            {recipe.name_en && (
              <p className="text-xs text-cafe-muted line-clamp-1 font-mono">
                {recipe.name_en}
              </p>
            )}
          </div>

          {/* Description snippet */}
          {recipe.description && (
            <p className="text-xs text-cafe-muted line-clamp-2 mb-3 leading-relaxed">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Spec footer */}
        <div className="pt-3 border-t border-cafe-border/60 dark:border-cafe-darkBorder space-y-2">
          <div className="flex items-center justify-between text-xs text-cafe-muted">
            <span className="flex items-center gap-1 font-mono">
              <Layers className="w-3.5 h-3.5 text-cafe-copper" />
              {recipe.ingredients?.length || 0} วัตถุดิบ • {recipe.steps?.length || 0} ขั้นตอน
            </span>
            {recipe.prep_time_seconds > 0 && (
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {formatDuration(recipe.prep_time_seconds)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-cafe-muted/70 font-mono">
            {recipe.team_id ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cafe-copper bg-cafe-cream/80 dark:bg-cafe-darkSurface px-2 py-0.5 rounded-md border border-cafe-border/50 dark:border-cafe-darkBorder">
                <Users className="w-3 h-3" /> ในทีม
              </span>
            ) : (
              <span>v{recipe.current_version || 1}</span>
            )}
            <span>{formatDate(recipe.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

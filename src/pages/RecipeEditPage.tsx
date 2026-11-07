import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Recipe } from '../types';
import { recipeService } from '../services/recipeService';
import { RecipeEditor } from '../components/recipes/editor/RecipeEditor';

export const RecipeEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;

  const [recipe, setRecipe] = useState<Recipe | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(!isNew);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const loadRecipe = async () => {
      try {
        setIsLoading(true);
        const data = await recipeService.getRecipeById(id);
        if (data) setRecipe(data);
      } catch (err) {
        console.error('Error fetching recipe for edit:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipe();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <span className="w-8 h-8 border-2 border-cafe-copper border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-cafe-muted">กำลังเตรียมหน้าต่างจัดการสูตร...</span>
      </div>
    );
  }

  return <RecipeEditor initialRecipe={recipe} isNew={isNew} />;
};

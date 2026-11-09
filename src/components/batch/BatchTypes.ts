export interface BatchRowItem<T> {
  _rowId: string;
  _isNew: boolean;
  _isDeleted: boolean;
  _isModified: boolean;
  data: T;
  original: T;
}

export type BatchTabType = 'recipes' | 'ingredients' | 'categories';

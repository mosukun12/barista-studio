import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Plus,
  KeyRound,
  Copy,
  Check,
  Share2,
  Trash2,
  Edit3,
  BookOpen,
  Wheat,
  FolderTree,
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  UserPlus,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { teamService } from '../services/teamService';
import { recipeService } from '../services/recipeService';
import { ingredientService } from '../services/ingredientService';
import {
  Team,
  TeamMember,
  TeamRole,
  TeamShareItemType,
  TeamExportBundle,
  Recipe,
  Ingredient,
  Category,
} from '../types';

export const TeamsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'my-teams';

  const [activeTab, setActiveTab] = useState<'my-teams' | 'bulk-share' | 'export-import'>(
    initialTab === 'bulk-share' || initialTab === 'export-import' ? initialTab : 'my-teams'
  );

  // Teams list
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals for Team
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Manage Members Modal
  const [memberModalTeam, setMemberModalTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamRole>('barista');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);

  // Bulk Sharing Hub states
  const [shareItemType, setShareItemType] = useState<TeamShareItemType>('recipe');
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [sharedItemIds, setSharedItemIds] = useState<Set<string>>(new Set());
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [shareFilter, setShareFilter] = useState<'all' | 'shared' | 'not_shared'>('all');
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);
  const [bulkShareSuccessMsg, setBulkShareSuccessMsg] = useState<string | null>(null);

  // Export / Import states
  const [exportTeamId, setExportTeamId] = useState<string>('');
  const [importTeamId, setImportTeamId] = useState<string>('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<TeamExportBundle | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatusMsg, setImportStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync tab with URL
  const handleTabChange = (tab: 'my-teams' | 'bulk-share' | 'export-import') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Load all teams
  const loadTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      const teamList = await teamService.getTeams();
      setTeams(teamList);
      if (teamList.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teamList[0].id);
        setExportTeamId(teamList[0].id);
        setImportTeamId(teamList[0].id);
      }
    } catch (err) {
      console.error('Error loading teams:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // Load all master items for Bulk Sharing
  const loadMasterItems = useCallback(async () => {
    try {
      const [recs, ings, cats] = await Promise.all([
        recipeService.getRecipes(),
        ingredientService.getIngredients(),
        ingredientService.getCategories('all'),
      ]);
      setAllRecipes(recs);
      setAllIngredients(ings);
      setAllCategories(cats);
    } catch (err) {
      console.error('Error loading items for sharing:', err);
    }
  }, []);

  useEffect(() => {
    loadMasterItems();
  }, [loadMasterItems]);

  // Load shared item IDs whenever selectedTeamId or shareItemType changes
  const loadSharedIds = useCallback(async () => {
    if (!selectedTeamId) return;
    try {
      const ids = await teamService.getSharedItemIds(selectedTeamId, shareItemType);
      setSharedItemIds(new Set(ids));
      setSelectedItemIds(new Set()); // Clear selection on team/type switch
    } catch (err) {
      console.error('Error loading shared item IDs:', err);
    }
  }, [selectedTeamId, shareItemType]);

  useEffect(() => {
    loadSharedIds();
  }, [loadSharedIds]);

  // Copy invite code to clipboard
  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Create Team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      setIsCreating(true);
      const created = await teamService.createTeam({
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined,
      });
      setIsCreateModalOpen(false);
      setNewTeamName('');
      setNewTeamDescription('');
      await loadTeams();
      setSelectedTeamId(created.id);
    } catch (err: any) {
      alert(err.message || 'สร้างทีมไม่สำเร็จ');
    } finally {
      setIsCreating(false);
    }
  };

  // Join Team by code
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInviteCode.trim()) return;

    try {
      setIsJoining(true);
      setJoinError(null);
      const joined = await teamService.joinTeamByInviteCode(joinInviteCode);
      setIsJoinModalOpen(false);
      setJoinInviteCode('');
      await loadTeams();
      setSelectedTeamId(joined.id);
    } catch (err: any) {
      setJoinError(err.message || 'รหัสเชิญไม่ถูกต้อง');
    } finally {
      setIsJoining(false);
    }
  };

  // Edit Team
  const handleOpenEditTeam = (team: Team) => {
    setEditingTeam(team);
    setEditName(team.name);
    setEditDesc(team.description || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !editName.trim()) return;

    try {
      setIsSavingEdit(true);
      await teamService.updateTeam(editingTeam.id, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      setIsEditModalOpen(false);
      setEditingTeam(null);
      await loadTeams();
    } catch (err: any) {
      alert(err.message || 'แก้ไขทีมไม่สำเร็จ');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Team
  const handleDeleteTeam = async () => {
    if (!deletingTeam) return;
    try {
      setIsDeleting(true);
      await teamService.deleteTeam(deletingTeam.id);
      setDeletingTeam(null);
      await loadTeams();
    } catch (err: any) {
      alert(err.message || 'ลบทีมไม่สำเร็จ');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Manage Members Modal
  const handleOpenMembersModal = async (team: Team) => {
    setMemberModalTeam(team);
    setMemberActionError(null);
    setNewMemberEmail('');
    setNewMemberName('');
    setNewMemberRole('barista');
    try {
      setIsLoadingMembers(true);
      const members = await teamService.getTeamMembers(team.id);
      setTeamMembers(members);
    } catch (err) {
      console.error('Error loading team members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberModalTeam || !newMemberEmail.trim()) return;

    try {
      setIsAddingMember(true);
      setMemberActionError(null);
      await teamService.addMember(memberModalTeam.id, {
        email: newMemberEmail.trim(),
        full_name: newMemberName.trim() || undefined,
        role: newMemberRole,
      });
      setNewMemberEmail('');
      setNewMemberName('');
      const updated = await teamService.getTeamMembers(memberModalTeam.id);
      setTeamMembers(updated);
      await loadTeams();
    } catch (err: any) {
      setMemberActionError(err.message || 'เพิ่มสมาชิกไม่สำเร็จ');
    } finally {
      setIsAddingMember(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberId: string) => {
    if (!memberModalTeam) return;
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการนำสมาชิกนี้ออกจากทีม?')) return;

    try {
      // Optimistic instant UI update
      setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
      await teamService.removeMember(memberModalTeam.id, memberId);
      const updated = await teamService.getTeamMembers(memberModalTeam.id);
      setTeamMembers(updated);
      await loadTeams();
    } catch (err: any) {
      alert(err.message || 'นำสมาชิกออกไม่สำเร็จ');
      // Revert if error
      if (memberModalTeam) {
        const fallback = await teamService.getTeamMembers(memberModalTeam.id);
        setTeamMembers(fallback);
      }
    }
  };

  // Bulk Sharing items calculation
  const currentItems = useMemo(() => {
    if (shareItemType === 'recipe') {
      return allRecipes.map((r) => ({
        id: r.id,
        name: r.name_th,
        sub: r.name_en || r.category_name,
        type: 'recipe' as const,
        image: r.cover_image_url,
      }));
    }
    if (shareItemType === 'ingredient') {
      return allIngredients.map((i) => ({
        id: i.id,
        name: i.name,
        sub: i.brand || i.category_name,
        type: 'ingredient' as const,
        image: i.image_url,
      }));
    }
    return allCategories.map((c) => ({
      id: c.id,
      name: c.name,
      sub: c.category_type === 'recipe' ? 'หมวดหมู่สูตร' : 'หมวดหมู่วัตถุดิบ',
      type: 'category' as const,
      image: null,
    }));
  }, [shareItemType, allRecipes, allIngredients, allCategories]);

  // Filtered items in Bulk Sharing tab
  const filteredShareItems = useMemo(() => {
    return currentItems.filter((item) => {
      const isShared = sharedItemIds.has(item.id);
      if (shareFilter === 'shared' && !isShared) return false;
      if (shareFilter === 'not_shared' && isShared) return false;

      if (shareSearchQuery.trim()) {
        const q = shareSearchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSub = (item.sub || '').toLowerCase().includes(q);
        if (!matchName && !matchSub) return false;
      }
      return true;
    });
  }, [currentItems, sharedItemIds, shareFilter, shareSearchQuery]);

  // Toggle selection for single item
  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all / Deselect all
  const handleSelectAllFiltered = () => {
    if (selectedItemIds.size === filteredShareItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredShareItems.map((i) => i.id)));
    }
  };

  // Apply Bulk Share or Unshare
  const handleApplyBulkShare = async (share: boolean) => {
    if (!selectedTeamId || selectedItemIds.size === 0) return;

    try {
      setIsUpdatingShare(true);
      const ids = Array.from(selectedItemIds);
      await teamService.bulkShare(selectedTeamId, shareItemType, ids, share);

      const targetTeam = teams.find((t) => t.id === selectedTeamId);
      setBulkShareSuccessMsg(
        share
          ? `แชร์ ${ids.length} รายการเข้าทีม "${targetTeam?.name}" เรียบร้อยแล้ว`
          : `ยกเลิกการแชร์ ${ids.length} รายการออกจากทีม "${targetTeam?.name}" แล้ว`
      );
      setTimeout(() => setBulkShareSuccessMsg(null), 3500);

      await loadSharedIds();
      await loadTeams();
    } catch (err: any) {
      alert(err.message || 'บันทึกการแชร์ไม่สำเร็จ');
    } finally {
      setIsUpdatingShare(false);
    }
  };

  // Quick 1-click share toggle
  const handleQuickToggleItem = async (itemId: string, currentlyShared: boolean) => {
    if (!selectedTeamId) return;
    try {
      if (currentlyShared) {
        await teamService.unshareItem(selectedTeamId, shareItemType, itemId);
      } else {
        await teamService.shareItem(selectedTeamId, shareItemType, itemId);
      }
      await loadSharedIds();
      await loadTeams();
    } catch (err: any) {
      console.error('Quick toggle failed:', err);
    }
  };

  // Export Bundle
  const handleExportTeam = async () => {
    if (!exportTeamId) return;
    try {
      const bundle = await teamService.exportTeamBundle(exportTeamId);
      teamService.downloadBundleJson(bundle);
    } catch (err: any) {
      alert(err.message || 'ส่งออกแพ็กเกจทีมไม่สำเร็จ');
    }
  };

  // Handle file select for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportStatusMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.recipes || parsed.ingredients || parsed.categories) {
          setImportPreview(parsed);
        } else {
          setImportStatusMsg({ type: 'error', text: 'ไฟล์ JSON นี้ไม่ใช่รูปแบบชุดข้อมูล Barista Studio ที่ถูกต้อง' });
          setImportPreview(null);
        }
      } catch (e) {
        setImportStatusMsg({ type: 'error', text: 'ไม่สามารถอ่านไฟล์ JSON ได้ กรุณาตรวจสอบไฟล์' });
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  };

  // Confirm Import Bundle
  const handleConfirmImport = async () => {
    if (!importTeamId || !importPreview) return;

    try {
      setIsImporting(true);
      const res = await teamService.importTeamBundle(importTeamId, importPreview);
      setImportStatusMsg({
        type: 'success',
        text: `นำเข้าสำเร็จ: สูตร ${res.recipesCount} รายการ, วัตถุดิบ ${res.ingredientsCount} รายการ, หมวดหมู่ ${res.categoriesCount} รายการ`,
      });
      setImportFile(null);
      setImportPreview(null);
      await loadMasterItems();
      await loadTeams();
      await loadSharedIds();
    } catch (err: any) {
      setImportStatusMsg({ type: 'error', text: err.message || 'นำเข้าข้อมูลไม่สำเร็จ' });
    } finally {
      setIsImporting(false);
    }
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-cafe-copper/10 text-cafe-copper dark:bg-cafe-copper/20">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-cafe-text dark:text-cafe-cream">
              ระบบทีมและการแชร์ (Teams & Shared Workspace)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-cafe-muted">
            สร้างทีม ชวนบาริสต้า แชร์สูตร วัตถุดิบ และหมวดหมู่ร่วมกัน เพื่อมาตรฐานเดียวกันในร้าน
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setJoinInviteCode('');
              setJoinError(null);
              setIsJoinModalOpen(true);
            }}
            className="flex items-center gap-1.5 min-h-[42px]"
          >
            <KeyRound className="w-4 h-4 text-cafe-copper" />
            <span>เข้าร่วมด้วยรหัสเชิญ</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setNewTeamName('');
              setNewTeamDescription('');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างทีมใหม่</span>
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center border-b border-cafe-border dark:border-cafe-darkBorder gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleTabChange('my-teams')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'my-teams'
              ? 'border-cafe-copper text-cafe-copper dark:text-cafe-cream'
              : 'border-transparent text-cafe-muted hover:text-cafe-text dark:hover:text-stone-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>ทีมของฉัน ({teams.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('bulk-share')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'bulk-share'
              ? 'border-cafe-copper text-cafe-copper dark:text-cafe-cream'
              : 'border-transparent text-cafe-muted hover:text-cafe-text dark:hover:text-stone-300'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>ศูนย์จัดการการแชร์ (Bulk Share Hub)</span>
        </button>

        <button
          onClick={() => handleTabChange('export-import')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'export-import'
              ? 'border-cafe-copper text-cafe-copper dark:text-cafe-cream'
              : 'border-transparent text-cafe-muted hover:text-cafe-text dark:hover:text-stone-300'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>ส่งออก / นำเข้าแพ็กเกจสูตร</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MY TEAMS */}
      {/* ========================================================================= */}
      {activeTab === 'my-teams' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <span className="w-8 h-8 border-2 border-cafe-copper border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-cafe-muted">กำลังโหลดข้อมูลทีม...</span>
            </div>
          ) : teams.length === 0 ? (
            <EmptyState
              title="ยังไม่มีทีมที่คุณเข้าร่วม"
              description="เริ่มต้นสร้างทีมร้านกาแฟของคุณ หรือกรอกรหัสเชิญเพื่อเข้าร่วมทีมของเพื่อนร่วมงาน"
              actionLabel="สร้างทีมแรกของคุณ"
              onAction={() => setIsCreateModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="group flex flex-col justify-between bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 hover:border-cafe-copper/70 dark:hover:border-cafe-copper/70 transition-all shadow-cafe-subtle"
                >
                  <div className="space-y-3">
                    {/* Top row: Role badge & Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cafe-cream dark:bg-cafe-darkSurface text-cafe-copper border border-cafe-border/60 dark:border-cafe-darkBorder">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {team.current_user_role === 'owner' ? 'เจ้าของทีม (Owner)' : 'สมาชิก (Member)'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditTeam(team)}
                          className="p-1.5 text-cafe-muted hover:text-cafe-copper rounded-lg hover:bg-cafe-cream dark:hover:bg-cafe-darkSurface transition-colors"
                          title="แก้ไขข้อมูลทีม"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {team.current_user_role === 'owner' && (
                          <button
                            onClick={() => setDeletingTeam(team)}
                            className="p-1.5 text-cafe-muted hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="ลบทีม"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Team Info */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-cafe-text dark:text-cafe-cream group-hover:text-cafe-copper transition-colors">
                        {team.name}
                      </h3>
                      {team.description && (
                        <p className="mt-1 text-xs text-cafe-muted line-clamp-2 leading-relaxed">
                          {team.description}
                        </p>
                      )}
                    </div>

                    {/* Invite Code Pill */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-cafe-cream/60 dark:bg-cafe-darkSurface/60 border border-cafe-border/70 dark:border-cafe-darkBorder">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <KeyRound className="w-3.5 h-3.5 text-cafe-copper flex-shrink-0" />
                        <span className="text-[11px] font-semibold text-cafe-muted">รหัสเชิญ:</span>
                        <code className="text-xs font-mono font-bold text-cafe-text dark:text-cafe-cream tracking-wider truncate">
                          {team.invite_code}
                        </code>
                      </div>
                      <button
                        onClick={() => handleCopyInviteCode(team.invite_code)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-cafe-surface dark:bg-cafe-darkCard hover:bg-cafe-copper hover:text-white dark:hover:bg-cafe-copper border border-cafe-border/80 dark:border-cafe-darkBorder transition-all"
                        title="คัดลอกรหัสเชิญ"
                      >
                        {copiedCode === team.invite_code ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-700 dark:text-emerald-300">คัดลอกแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>คัดลอก</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Stat Badges Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 rounded-xl bg-cafe-cream/40 dark:bg-cafe-darkSurface/40 border border-cafe-border/40 dark:border-cafe-darkBorder/60 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        <div>
                          <div className="text-[10px] text-cafe-muted font-medium">สมาชิก</div>
                          <div className="text-xs font-bold text-cafe-text dark:text-cafe-cream">
                            {team.members_count || 1} คน
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-cafe-cream/40 dark:bg-cafe-darkSurface/40 border border-cafe-border/40 dark:border-cafe-darkBorder/60 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <div>
                          <div className="text-[10px] text-cafe-muted font-medium">สูตรในทีม</div>
                          <div className="text-xs font-bold text-cafe-text dark:text-cafe-cream">
                            {team.shared_recipes_count || 0} สูตร
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-cafe-cream/40 dark:bg-cafe-darkSurface/40 border border-cafe-border/40 dark:border-cafe-darkBorder/60 flex items-center gap-2">
                        <Wheat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <div className="text-[10px] text-cafe-muted font-medium">วัตถุดิบ</div>
                          <div className="text-xs font-bold text-cafe-text dark:text-cafe-cream">
                            {team.shared_ingredients_count || 0} รายการ
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-cafe-cream/40 dark:bg-cafe-darkSurface/40 border border-cafe-border/40 dark:border-cafe-darkBorder/60 flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <div>
                          <div className="text-[10px] text-cafe-muted font-medium">หมวดหมู่</div>
                          <div className="text-xs font-bold text-cafe-text dark:text-cafe-cream">
                            {team.shared_categories_count || 0} หมวด
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-cafe-border/60 dark:border-cafe-darkBorder">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenMembersModal(team)}
                      className="flex items-center justify-center gap-1.5 w-full min-h-[38px] text-xs font-medium"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>จัดการสมาชิก</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedTeamId(team.id);
                        handleTabChange('bulk-share');
                      }}
                      className="flex items-center justify-center gap-1.5 w-full min-h-[38px] text-xs font-medium"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>ศูนย์แชร์ข้อมูล</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BULK SHARING CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'bulk-share' && (
        <div className="space-y-5">
          {/* Top Bar: Select Target Team & Feedback message */}
          <div className="p-4 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-cafe-subtle">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-cafe-copper/10 text-cafe-copper flex-shrink-0">
                <Share2 className="w-5 h-5" />
              </span>
              <div>
                <label className="block text-xs font-semibold text-cafe-muted">ทีมเป้าหมายที่กำลังจัดการ:</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="mt-0.5 text-sm sm:text-base font-bold bg-transparent text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-1 focus:ring-cafe-copper rounded-lg py-1 pr-4"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} className="dark:bg-cafe-darkCard">
                      👥 {t.name} (รหัส {t.invite_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {bulkShareSuccessMsg && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{bulkShareSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Subtabs: Recipe / Ingredient / Category */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder overflow-x-auto no-scrollbar">
            <button
              onClick={() => setShareItemType('recipe')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[40px] ${
                shareItemType === 'recipe'
                  ? 'bg-cafe-copper text-white shadow-xs'
                  : 'text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>สูตรเครื่องดื่ม ({allRecipes.length})</span>
            </button>

            <button
              onClick={() => setShareItemType('ingredient')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[40px] ${
                shareItemType === 'ingredient'
                  ? 'bg-cafe-copper text-white shadow-xs'
                  : 'text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream'
              }`}
            >
              <Wheat className="w-4 h-4" />
              <span>วัตถุดิบในคลัง ({allIngredients.length})</span>
            </button>

            <button
              onClick={() => setShareItemType('category')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[40px] ${
                shareItemType === 'category'
                  ? 'bg-cafe-copper text-white shadow-xs'
                  : 'text-cafe-muted hover:text-cafe-text dark:hover:text-cafe-cream'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>หมวดหมู่ ({allCategories.length})</span>
            </button>
          </div>

          {/* Search, Filter, and Selection Summary */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cafe-muted" />
              <input
                type="text"
                value={shareSearchQuery}
                onChange={(e) => setShareSearchQuery(e.target.value)}
                placeholder="ค้นหารายการ..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center p-1 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder text-xs">
                <button
                  onClick={() => setShareFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    shareFilter === 'all'
                      ? 'bg-cafe-cream dark:bg-cafe-darkSurface text-cafe-copper font-bold'
                      : 'text-cafe-muted'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setShareFilter('shared')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    shareFilter === 'shared'
                      ? 'bg-cafe-cream dark:bg-cafe-darkSurface text-cafe-copper font-bold'
                      : 'text-cafe-muted'
                  }`}
                >
                  แชร์แล้ว ({sharedItemIds.size})
                </button>
                <button
                  onClick={() => setShareFilter('not_shared')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    shareFilter === 'not_shared'
                      ? 'bg-cafe-cream dark:bg-cafe-darkSurface text-cafe-copper font-bold'
                      : 'text-cafe-muted'
                  }`}
                >
                  ยังไม่แชร์
                </button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAllFiltered}
                className="text-xs text-cafe-muted hover:text-cafe-copper"
              >
                {selectedItemIds.size === filteredShareItems.length && filteredShareItems.length > 0
                  ? 'ยกเลิกเลือกทั้งหมด'
                  : 'เลือกทั้งหมด'}
              </Button>
            </div>
          </div>

          {/* List / Table of Items */}
          {filteredShareItems.length === 0 ? (
            <div className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-12 text-center">
              <p className="text-sm text-cafe-muted">ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder overflow-hidden shadow-cafe-subtle divide-y divide-cafe-border/60 dark:divide-cafe-darkBorder">
              {filteredShareItems.map((item) => {
                const isSelected = selectedItemIds.has(item.id);
                const isShared = sharedItemIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3.5 sm:p-4 hover:bg-cafe-cream/40 dark:hover:bg-cafe-darkSurface/50 transition-colors gap-3 ${
                      isSelected ? 'bg-cafe-cream/60 dark:bg-cafe-darkSurface/70' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectItem(item.id)}
                        className="w-5 h-5 rounded border-cafe-border text-cafe-copper focus:ring-cafe-copper flex-shrink-0 cursor-pointer"
                      />

                      {/* Icon or Thumbnail */}
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover border border-cafe-border dark:border-cafe-darkBorder flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-cafe-cream dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder flex items-center justify-center text-cafe-copper flex-shrink-0">
                          {shareItemType === 'recipe' && <BookOpen className="w-5 h-5" />}
                          {shareItemType === 'ingredient' && <Wheat className="w-5 h-5" />}
                          {shareItemType === 'category' && <FolderTree className="w-5 h-5" />}
                        </div>
                      )}

                      {/* Text info */}
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-cafe-text dark:text-cafe-cream truncate">
                          {item.name}
                        </h4>
                        {item.sub && (
                          <p className="text-xs text-cafe-muted truncate">{item.sub}</p>
                        )}
                      </div>
                    </div>

                    {/* Sharing Status & Quick Action Button */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isShared ? (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>แชร์ในทีมนี้</span>
                        </span>
                      ) : (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cafe-cream dark:bg-cafe-darkSurface text-cafe-muted border border-cafe-border/60 dark:border-cafe-darkBorder">
                          <span>🔒 ส่วนตัว</span>
                        </span>
                      )}

                      <Button
                        variant={isShared ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleQuickToggleItem(item.id, isShared)}
                        className="text-xs min-h-[36px]"
                      >
                        {isShared ? 'ยกเลิกแชร์' : 'แชร์เข้าทีม'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Sticky Bottom Action Bar (Rule 2 - Mobile-first Sticky Footer) */}
          {selectedItemIds.size > 0 && (
            <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:w-[460px] z-40 bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl shadow-2xl border border-cafe-border dark:border-cafe-darkBorder p-3.5 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-cafe-copper text-white text-xs font-bold flex items-center justify-center">
                  {selectedItemIds.size}
                </span>
                <span className="text-xs font-semibold text-cafe-text dark:text-cafe-cream">
                  รายการที่เลือก
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleApplyBulkShare(false)}
                  disabled={isUpdatingShare}
                  className="text-xs min-h-[38px]"
                >
                  ยกเลิกแชร์
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApplyBulkShare(true)}
                  isLoading={isUpdatingShare}
                  className="text-xs min-h-[38px] flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>แชร์เข้าทีม</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EXPORT / IMPORT PACKAGES */}
      {/* ========================================================================= */}
      {activeTab === 'export-import' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Bundle Card */}
          <div className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 space-y-4 shadow-cafe-subtle">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                <Download className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-cafe-text dark:text-cafe-cream">
                  ส่งออกแพ็กเกจทีม (Export Team Bundle)
                </h3>
                <p className="text-xs text-cafe-muted">
                  ดาวน์โหลดชุดข้อมูลสูตร วัตถุดิบ และหมวดหมู่ที่แชร์ในทีมเป็นไฟล์ .JSON
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300">
                เลือกทีมที่ต้องการส่งออก:
              </label>
              <select
                value={exportTeamId}
                onChange={(e) => setExportTeamId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    👥 {t.name} (สูตร {t.shared_recipes_count || 0} รายการ)
                  </option>
                ))}
              </select>

              <div className="p-3.5 rounded-xl bg-cafe-cream/50 dark:bg-cafe-darkSurface/50 border border-cafe-border/60 dark:border-cafe-darkBorder text-xs text-cafe-muted space-y-1.5 leading-relaxed">
                <div>• สามารถนำไฟล์ .JSON นี้ไปแชร์ให้ทีมสาขาอื่นหรือสำรองข้อมูลได้</div>
                <div>• รวมขั้นตอนการชง โน้ตเทคนิค และรายการวัตถุดิบครบถ้วน</div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleExportTeam}
                disabled={!exportTeamId}
                className="w-full flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดชุดข้อมูล (.JSON)</span>
              </Button>
            </div>
          </div>

          {/* Import Bundle Card */}
          <div className="bg-cafe-surface dark:bg-cafe-darkCard rounded-2xl border border-cafe-border dark:border-cafe-darkBorder p-5 sm:p-6 space-y-4 shadow-cafe-subtle">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Upload className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-cafe-text dark:text-cafe-cream">
                  นำเข้าแพ็กเกจทีม (Import Team Bundle)
                </h3>
                <p className="text-xs text-cafe-muted">
                  นำเข้าสูตร วัตถุดิบ และหมวดหมู่จากไฟล์ .JSON เข้าสู่ทีมที่ต้องการ
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300">
                เลือกทีมปลายทางที่ต้องการนำเข้าข้อมูล:
              </label>
              <select
                value={importTeamId}
                onChange={(e) => setImportTeamId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:ring-2 focus:ring-cafe-copper focus:outline-none"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    👥 {t.name}
                  </option>
                ))}
              </select>

              {/* File upload zone */}
              <div className="relative border-2 border-dashed border-cafe-border dark:border-cafe-darkBorder hover:border-cafe-copper rounded-2xl p-5 text-center cursor-pointer transition-colors bg-cafe-cream/30 dark:bg-cafe-darkSurface/30">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-7 h-7 mx-auto text-cafe-copper mb-2" />
                <div className="text-xs font-bold text-cafe-text dark:text-cafe-cream">
                  {importFile ? importFile.name : 'คลิกเพื่อเลือกไฟล์แพ็กเกจ (.JSON)'}
                </div>
                <p className="text-[11px] text-cafe-muted mt-1">
                  รองรับไฟล์ชุดข้อมูลมาตรฐาน Barista Studio
                </p>
              </div>

              {/* Status messages */}
              {importStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    importStatusMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {importStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{importStatusMsg.text}</span>
                </div>
              )}

              {/* Preview info if loaded */}
              {importPreview && (
                <div className="p-3.5 rounded-xl bg-cafe-cream/60 dark:bg-cafe-darkSurface/60 border border-cafe-border/80 dark:border-cafe-darkBorder text-xs space-y-1">
                  <div className="font-bold text-cafe-text dark:text-cafe-cream">
                    ข้อมูลในไฟล์: {importPreview.team?.name || 'แพ็กเกจสูตร'}
                  </div>
                  <div className="text-cafe-muted flex items-center gap-3">
                    <span>📖 {importPreview.recipes?.length || 0} สูตร</span>
                    <span>🌾 {importPreview.ingredients?.length || 0} วัตถุดิบ</span>
                    <span>📁 {importPreview.categories?.length || 0} หมวดหมู่</span>
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmImport}
                disabled={!importFile || !importPreview || !importTeamId || isImporting}
                isLoading={isImporting}
                className="w-full flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Upload className="w-4 h-4" />
                <span>ยืนยันการนำเข้าข้อมูลเข้าทีม</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE TEAM */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="สร้างทีมใหม่ (Create Team)"
          description="สร้างทีมเวิร์กสเปซสำหรับสาขาหรือทีมบาริสต้าของคุณ"
        >
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                ชื่อทีม <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="เช่น Barista Studio - Sukhumvit Branch, The Lab"
                className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                คำอธิบายทีม (Optional)
              </label>
              <textarea
                rows={3}
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="รายละเอียดทีม หน้าที่ หรือจุดประสงค์การใช้งาน..."
                className="w-full px-3.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper resize-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-cafe-cream/60 dark:bg-cafe-darkSurface/60 border border-cafe-border/60 dark:border-cafe-darkBorder text-xs text-cafe-muted">
              💡 ระบบจะสร้าง <strong>รหัสเชิญ (Invite Code)</strong> อัตโนมัติ เพื่อให้คุณแชร์ให้สมาชิกเข้าทีมได้ทันที
            </div>

            {/* Sticky Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-cafe-border/60 dark:border-cafe-darkBorder">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isCreating}
              >
                สร้างทีม
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: JOIN TEAM */}
      {/* ========================================================================= */}
      {isJoinModalOpen && (
        <Modal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          title="เข้าร่วมทีมด้วยรหัสเชิญ (Join Team)"
          description="กรอกรหัสเชิญที่ได้รับจากเจ้าของทีมเพื่อเข้าใช้งานเวิร์กสเปซร่วมกัน"
        >
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                รหัสเชิญเข้าทีม (Invite Code) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={joinInviteCode}
                onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
                placeholder="เช่น BARISTA-7788"
                className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm font-mono tracking-wider font-bold text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
              />
            </div>

            {joinError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            {/* Sticky Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-cafe-border/60 dark:border-cafe-darkBorder">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsJoinModalOpen(false)}
                disabled={isJoining}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isJoining}
              >
                เข้าร่วมทีม
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT TEAM */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingTeam && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="แก้ไขข้อมูลทีม"
        >
          <form onSubmit={handleSaveEditTeam} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                ชื่อทีม <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cafe-text dark:text-stone-300 mb-1.5">
                คำอธิบายทีม
              </label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-sm text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-cafe-border/60 dark:border-cafe-darkBorder">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSavingEdit}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingEdit}
              >
                บันทึกการแก้ไข
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANAGE TEAM MEMBERS */}
      {/* ========================================================================= */}
      {memberModalTeam && (
        <Modal
          isOpen={Boolean(memberModalTeam)}
          onClose={() => setMemberModalTeam(null)}
          title={`สมาชิกในทีม: ${memberModalTeam.name}`}
          description={`รหัสเชิญเข้าทีม: ${memberModalTeam.invite_code}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            {/* Shareable Invite Code banner */}
            <div className="p-3.5 rounded-xl bg-cafe-cream/60 dark:bg-cafe-darkSurface/60 border border-cafe-border/80 dark:border-cafe-darkBorder flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-cafe-muted">รหัสเชิญสำหรับบาริสต้าใหม่:</span>
                <div className="text-sm font-mono font-bold text-cafe-text dark:text-cafe-cream tracking-wider">
                  {memberModalTeam.invite_code}
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopyInviteCode(memberModalTeam.invite_code)}
                className="flex items-center gap-1.5 text-xs"
              >
                {copiedCode === memberModalTeam.invite_code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกรหัส</span>
                  </>
                )}
              </Button>
            </div>

            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="p-4 rounded-xl bg-cafe-surface dark:bg-cafe-darkCard border border-cafe-border dark:border-cafe-darkBorder space-y-3">
              <h4 className="text-xs font-bold text-cafe-text dark:text-cafe-cream flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-cafe-copper" />
                เพิ่มสมาชิกใหม่ด้วยอีเมล
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-1">
                  <input
                    type="email"
                    required
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="อีเมล (Email) *"
                    className="w-full px-3 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
                  />
                </div>
                <div className="sm:col-span-1">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="ชื่อผู้ใช้ (Optional)"
                    className="w-full px-3 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
                  />
                </div>
                <div className="sm:col-span-1 flex gap-2">
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as TeamRole)}
                    className="w-full px-2.5 py-2 rounded-xl bg-cafe-surface dark:bg-cafe-darkSurface border border-cafe-border dark:border-cafe-darkBorder text-xs text-cafe-text dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-copper"
                  >
                    <option value="barista">บาริสต้า (Barista)</option>
                    <option value="admin">ผู้ดูแล (Admin)</option>
                    <option value="viewer">ผู้ชม (Viewer)</option>
                  </select>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isAddingMember}
                    className="flex-shrink-0 text-xs px-3"
                  >
                    เพิ่ม
                  </Button>
                </div>
              </div>

              {memberActionError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {memberActionError}
                </p>
              )}
            </form>

            {/* Member List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-cafe-muted uppercase tracking-wider">
                สมาชิกปัจจุบัน ({teamMembers.length} คน)
              </h4>

              {isLoadingMembers ? (
                <div className="p-6 text-center text-xs text-cafe-muted">กำลังโหลดรายชื่อสมาชิก...</div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-cafe-border/60 dark:divide-cafe-darkBorder border border-cafe-border dark:border-cafe-darkBorder rounded-xl">
                  {teamMembers.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 flex items-center justify-between gap-3 bg-cafe-surface dark:bg-cafe-darkCard"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-cafe-copper/15 text-cafe-copper font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {m.full_name ? m.full_name.charAt(0).toUpperCase() : m.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-cafe-text dark:text-cafe-cream truncate">
                            {m.full_name || m.email.split('@')[0]}
                          </div>
                          <div className="text-[11px] text-cafe-muted truncate font-mono">
                            {m.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-cafe-cream dark:bg-cafe-darkSurface text-cafe-copper border border-cafe-border/60 dark:border-cafe-darkBorder">
                          {m.role === 'owner' ? '👑 เจ้าของ' : m.role === 'admin' ? '🛡️ แอดมิน' : 'บาริสต้า'}
                        </span>
                        {m.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="p-1 text-cafe-muted hover:text-rose-600 rounded transition-colors"
                            title="นำสมาชิกออก"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="flex justify-end pt-3 border-t border-cafe-border/60 dark:border-cafe-darkBorder">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setMemberModalTeam(null)}
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DIALOG: DELETE TEAM */}
      {/* ========================================================================= */}
      {deletingTeam && (
        <ConfirmDialog
          isOpen={Boolean(deletingTeam)}
          onClose={() => setDeletingTeam(null)}
          onConfirm={handleDeleteTeam}
          title="ยืนยันการลบทีม"
          message={`คุณแน่ใจหรือไม่ว่าต้องการลบทีม "${deletingTeam.name}"? การดำเนินการนี้จะลบการเชื่อมต่อและการแชร์ทั้งหมดในทีมนี้`}
          confirmLabel="ลบทีมถาวร"
          isDestructive
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default TeamsPage;

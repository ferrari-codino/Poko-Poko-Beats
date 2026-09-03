import React, { useState } from 'react';
import {
  CustomDrumKit,
  ShellMaterial,
  DrumHeadStyle,
  HardwareFinish,
  CymbalFinish,
} from '../types';
import {
  SHELL_MATERIALS,
  SHELL_COLORS,
  HEAD_STYLES,
  HARDWARE_FINISHES,
  CYMBAL_FINISHES,
  saveCustomKits,
} from '../data/customDrumKits';
import { Sparkles, Check, Star, Plus, Trash2, Edit3, Shield, Volume2, X } from 'lucide-react';
import { drumSynth } from '../audio/drumSynth';

interface MyDrumKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  customKits: CustomDrumKit[];
  activeKitId: string;
  onSelectKit: (kitId: string) => void;
  onUpdateKits: (kits: CustomDrumKit[]) => void;
}

export const MyDrumKitModal: React.FC<MyDrumKitModalProps> = ({
  isOpen,
  onClose,
  customKits,
  activeKitId,
  onSelectKit,
  onUpdateKits,
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(() => {
    const idx = customKits.findIndex((k) => k.id === activeKitId);
    return idx >= 0 ? idx : 0;
  });

  const currentKit: CustomDrumKit = customKits[selectedSlotIndex] || customKits[0];

  const [editingName, setEditingName] = useState<string>(currentKit?.name || 'My Custom Kit');
  const [activeTab, setActiveTab] = useState<'shell' | 'color' | 'head' | 'hardware' | 'cymbal'>('shell');

  if (!isOpen || !currentKit) return null;

  const handleUpdateCurrentKit = (partial: Partial<CustomDrumKit>) => {
    const updated = [...customKits];
    updated[selectedSlotIndex] = {
      ...updated[selectedSlotIndex],
      ...partial,
    };
    onUpdateKits(updated);
    saveCustomKits(updated);
  };

  const handleSetDefault = (kitId: string) => {
    const updated = customKits.map((k) => ({
      ...k,
      isDefault: k.id === kitId,
    }));
    onUpdateKits(updated);
    saveCustomKits(updated);
  };

  const handleCreateNewKit = () => {
    if (customKits.length >= 5) return;
    const newKit: CustomDrumKit = {
      id: `kit-slot-${Date.now()}`,
      name: `マイドラム #${customKits.length + 1} 🥁`,
      shellMaterial: 'maple',
      shellColor: '#2563eb',
      headStyle: 'coatedWhite',
      hardwareFinish: 'chrome',
      cymbalFinish: 'brilliantGold',
      isDefault: false,
      createdAt: Date.now(),
    };
    const updated = [...customKits, newKit];
    onUpdateKits(updated);
    saveCustomKits(updated);
    setSelectedSlotIndex(updated.length - 1);
    setEditingName(newKit.name);
  };

  const handleDeleteKit = (indexToDelete: number) => {
    if (customKits.length <= 1) return;
    const updated = customKits.filter((_, i) => i !== indexToDelete);
    // Ensure at least one is default
    if (!updated.some((k) => k.isDefault)) {
      updated[0].isDefault = true;
    }
    onUpdateKits(updated);
    saveCustomKits(updated);
    setSelectedSlotIndex(Math.max(0, indexToDelete - 1));
  };

  // Preview test sound
  const handleTestHit = () => {
    drumSynth.playDrum('snare');
    setTimeout(() => drumSynth.playDrum('kick'), 120);
    setTimeout(() => drumSynth.playDrum('crash'), 240);
  };

  const selectedMaterial = SHELL_MATERIALS.find((m) => m.id === currentKit.shellMaterial) || SHELL_MATERIALS[0];
  const selectedHead = HEAD_STYLES.find((h) => h.id === currentKit.headStyle) || HEAD_STYLES[0];
  const selectedHardware = HARDWARE_FINISHES.find((h) => h.id === currentKit.hardwareFinish) || HARDWARE_FINISHES[0];
  const selectedCymbal = CYMBAL_FINISHES.find((c) => c.id === currentKit.cymbalFinish) || CYMBAL_FINISHES[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-b border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-xl shadow-lg border border-white/40">
              🥁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  マイドラムセット工房
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px] border border-indigo-400/40">
                  タブレット専用・5スロット
                </span>
              </div>
              <p className="text-xs text-slate-300">
                素材・シェル色・ヘッド・ハードウェアをカスタマイズしてお気に入りのセットを作成！
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-SLOT SELECTION TABS */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            {customKits.map((kit, idx) => {
              const isSelected = idx === selectedSlotIndex;
              return (
                <button
                  key={kit.id}
                  type="button"
                  onClick={() => {
                    setSelectedSlotIndex(idx);
                    setEditingName(kit.name);
                    onSelectKit(kit.id);
                  }}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-black transition flex items-center gap-1.5 shrink-0 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-white/60 shadow-lg scale-105'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span>{kit.isDefault ? '⭐' : '🥁'}</span>
                  <span className="max-w-[110px] truncate">{kit.name}</span>
                  {kit.isDefault && (
                    <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black">
                      DEF
                    </span>
                  )}
                </button>
              );
            })}

            {customKits.length < 5 && (
              <button
                type="button"
                onClick={handleCreateNewKit}
                className="px-3 py-1.5 rounded-2xl text-xs font-bold text-slate-400 bg-slate-900/60 border border-dashed border-slate-700 hover:border-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
                title="新しいスロットを作成（最大5つ）"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>追加 ({customKits.length}/5)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!currentKit.isDefault && (
              <button
                type="button"
                onClick={() => handleSetDefault(currentKit.id)}
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1 transition"
                title="起動時に自動適用されるデフォルトドラムセットに指定"
              >
                <Star className="w-3.5 h-3.5" />
                <span>デフォルトに設定</span>
              </button>
            )}

            {customKits.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteKit(selectedSlotIndex)}
                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs transition"
                title="このスロットを削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* MODAL MAIN CONTENT: PREVIEW ON TOP/LEFT, CONTROLS ON BOTTOM/RIGHT */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT: 3D REAL-TIME KIT VISUAL PREVIEW & TEST HIT */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-950 to-slate-900 rounded-3xl p-4 border border-slate-800 flex flex-col justify-between relative overflow-hidden shadow-inner">
            {/* Nickname Editor */}
            <div className="flex items-center gap-2 mb-3 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
              <Edit3 className="w-4 h-4 text-indigo-400 shrink-0" />
              <input
                type="text"
                value={editingName}
                maxLength={20}
                onChange={(e) => {
                  setEditingName(e.target.value);
                  handleUpdateCurrentKit({ name: e.target.value });
                }}
                className="w-full bg-transparent text-sm font-black text-white outline-none"
                placeholder="マイドラムセットの愛称"
              />
            </div>

            {/* Visual Drum Riser / Mat Platform in Preview */}
            <div className="relative my-auto flex flex-col items-center justify-center p-3">
              {/* Drum Stage Rug Base */}
              <div
                className="absolute inset-x-2 inset-y-1 rounded-[36px] border border-amber-500/20 shadow-2xl"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 60%, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 75%, rgba(2, 6, 23, 1) 100%)',
                }}
              />

              {/* Hardware stand legs subtle shadows */}
              <div className="absolute bottom-4 inset-x-8 h-6 bg-black/40 rounded-full blur-md" />

              {/* Mini 3D Drum Model Representation */}
              <div className="relative z-10 w-full max-w-[300px] aspect-[4/3] flex flex-col items-center justify-between p-2">
                {/* Cymbal row */}
                <div className="w-full flex items-center justify-between px-2">
                  <div
                    className="w-16 h-16 rounded-full shadow-lg border-2 flex items-center justify-center text-[10px] font-black"
                    style={{
                      background: selectedCymbal.gradient,
                      borderColor: selectedCymbal.borderColor,
                      color: selectedHardware.color,
                      transform: 'rotateX(30deg)',
                    }}
                  >
                    CRASH
                  </div>
                  <div
                    className="w-16 h-16 rounded-full shadow-lg border-2 flex items-center justify-center text-[10px] font-black"
                    style={{
                      background: selectedCymbal.gradient,
                      borderColor: selectedCymbal.borderColor,
                      color: selectedHardware.color,
                      transform: 'rotateX(30deg)',
                    }}
                  >
                    RIDE
                  </div>
                </div>

                {/* Toms row */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-full border-4 shadow-xl flex items-center justify-center text-[9px] font-black"
                    style={{
                      backgroundColor: selectedHead.color,
                      borderColor: selectedHardware.color,
                      boxShadow: `0 0 12px ${currentKit.shellColor}66, inset 0 0 8px ${currentKit.shellColor}`,
                      color: currentKit.shellColor,
                      transform: 'rotateX(20deg)',
                    }}
                  >
                    TOM
                  </div>
                  <div
                    className="w-14 h-14 rounded-full border-4 shadow-xl flex items-center justify-center text-[9px] font-black"
                    style={{
                      backgroundColor: selectedHead.color,
                      borderColor: selectedHardware.color,
                      boxShadow: `0 0 12px ${currentKit.shellColor}66, inset 0 0 8px ${currentKit.shellColor}`,
                      color: currentKit.shellColor,
                      transform: 'rotateX(20deg)',
                    }}
                  >
                    TOM
                  </div>
                </div>

                {/* Snare & Kick bottom row */}
                <div className="w-full flex items-center justify-around">
                  <div
                    className="w-20 h-20 rounded-full border-4 shadow-2xl flex items-center justify-center text-xs font-black relative"
                    style={{
                      backgroundColor: selectedHead.color,
                      borderColor: selectedHardware.color,
                      boxShadow: `0 0 16px ${currentKit.shellColor}, inset 0 0 12px ${currentKit.shellColor}`,
                      color: selectedHead.id === 'clearEbony' ? '#fff' : '#0f172a',
                      transform: 'rotateX(22deg)',
                    }}
                  >
                    SNARE
                    <div
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border"
                      style={{ backgroundColor: selectedHardware.color, borderColor: '#fff' }}
                      title="フープ＆テンションボルト"
                    />
                  </div>

                  <div
                    className="w-24 h-24 rounded-full border-4 shadow-2xl flex flex-col items-center justify-center text-xs font-black"
                    style={{
                      backgroundColor: currentKit.shellColor,
                      borderColor: selectedHardware.color,
                      boxShadow: `0 0 20px ${currentKit.shellColor}aa`,
                      color: '#fff',
                      backgroundImage: selectedMaterial.texturePattern,
                    }}
                  >
                    <span className="text-[10px] opacity-80 font-mono">22" BASS</span>
                    <span>KICK</span>
                  </div>
                </div>
              </div>

              {/* Hardware stand feet visual */}
              <div className="w-full flex items-center justify-center gap-6 mt-1 opacity-70">
                <div className="flex flex-col items-center">
                  <div className="w-1 h-4" style={{ backgroundColor: selectedHardware.color }} />
                  <div className="w-6 h-1 rounded-full bg-slate-900 border border-slate-700" />
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-1 h-5" style={{ backgroundColor: selectedHardware.color }} />
                  <div className="w-8 h-1 rounded-full bg-slate-900 border border-slate-700" />
                </div>
              </div>
            </div>

            {/* Test Sound Button */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="text-[11px] text-slate-300">
                {selectedMaterial.name} / {selectedHardware.name}
              </div>
              <button
                type="button"
                onClick={handleTestHit}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:opacity-90 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>サウンド試聴</span>
              </button>
            </div>
          </div>

          {/* RIGHT: CUSTOMIZATION CONTROLS */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Category Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
              {[
                { id: 'shell', label: '1. シェル素材' },
                { id: 'color', label: '2. カラー' },
                { id: 'head', label: '3. ドラムヘッド' },
                { id: 'hardware', label: '4. ハードウェア' },
                { id: 'cymbal', label: '5. シンバル' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: SHELL MATERIAL */}
            {activeTab === 'shell' && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-bold">
                  ドラムシェルの木材・素材を選択（音の響きとテクスチャが変化します）:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SHELL_MATERIALS.map((mat) => {
                    const isSelected = currentKit.shellMaterial === mat.id;
                    return (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => handleUpdateCurrentKit({ shellMaterial: mat.id })}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-400 ring-1 ring-indigo-400 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{mat.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <span className="text-[10px] text-indigo-300 font-mono">{mat.enName}</span>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{mat.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: SHELL COLOR */}
            {activeTab === 'color' && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-bold">
                  シェルのスパークル＆フィニッシュカラーを選択:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SHELL_COLORS.map((col) => {
                    const isSelected = currentKit.shellColor === col.hex;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => handleUpdateCurrentKit({ shellColor: col.hex })}
                        className={`p-2.5 rounded-2xl border flex flex-col items-center gap-2 transition ${
                          isSelected
                            ? 'bg-slate-800 border-indigo-400 ring-2 ring-indigo-400 shadow-lg'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full shadow-md border-2 border-white/60 relative flex items-center justify-center"
                          style={{ backgroundColor: col.hex }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                        </div>
                        <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">
                          {col.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: DRUM HEAD STYLE */}
            {activeTab === 'head' && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-bold">
                  ドラムヘッド（打面フィルム）を選択:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {HEAD_STYLES.map((head) => {
                    const isSelected = currentKit.headStyle === head.id;
                    return (
                      <button
                        key={head.id}
                        type="button"
                        onClick={() => handleUpdateCurrentKit({ headStyle: head.id })}
                        className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-400 ring-1 ring-indigo-400 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full border-2 shadow-inner shrink-0"
                          style={{ backgroundColor: head.color, borderColor: head.rimColor }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white">{head.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                            {head.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: HARDWARE FINISH (STAND LEGS & HOOPS) */}
            {activeTab === 'hardware' && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-bold">
                  スタンド脚・フープリム・ペダルの金属メッキ仕上げ:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {HARDWARE_FINISHES.map((hw) => {
                    const isSelected = currentKit.hardwareFinish === hw.id;
                    return (
                      <button
                        key={hw.id}
                        type="button"
                        onClick={() => handleUpdateCurrentKit({ hardwareFinish: hw.id })}
                        className={`p-3 rounded-2xl border text-left flex flex-col items-center text-center gap-2 transition ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-400 ring-1 ring-indigo-400 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-xl shadow-md border flex items-center justify-center"
                          style={{
                            backgroundColor: hw.color,
                            borderColor: hw.borderColor,
                            boxShadow: `0 0 10px ${hw.color}66`,
                          }}
                        >
                          <Shield className="w-6 h-6" style={{ color: hw.highlight }} />
                        </div>
                        <span className="text-xs font-black text-white">{hw.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-indigo-300 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> 選択中
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: CYMBAL FINISH */}
            {activeTab === 'cymbal' && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-bold">
                  シンバルの金属合金・磨きフィニッシュ:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CYMBAL_FINISHES.map((c) => {
                    const isSelected = currentKit.cymbalFinish === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleUpdateCurrentKit({ cymbalFinish: c.id })}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-400 ring-1 ring-indigo-400 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-11 h-11 rounded-full border-2 shadow-md shrink-0 flex items-center justify-center"
                          style={{
                            background: c.gradient,
                            borderColor: c.borderColor,
                          }}
                        >
                          <span className="text-xs">⚡</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white">{c.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </div>
                          <span className="text-[9px] text-amber-300 font-mono">B20 Alloy Finish</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CONFIRMATION / CLOSE BUTTON */}
            <div className="pt-2 mt-auto flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectKit(currentKit.id);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-black text-sm shadow-xl active:scale-95 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>このマイドラムセットで決定！</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

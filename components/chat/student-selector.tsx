"use client";

import { useState, useEffect } from "react";
import { User, Check, Edit2 } from "lucide-react";

export interface StudentIdentity {
  name: string;
  studentId: string;
}

const PRESET_STUDENTS: StudentIdentity[] = [
  { name: "Sakibul Hassan", studentId: "20-40532" },
  { name: "Farhan Ahmed", studentId: "20-40511" },
  { name: "Tasnia Islam", studentId: "20-40498" },
  { name: "Rafi Hossain", studentId: "21-41205" },
];

interface StudentSelectorProps {
  currentStudent: StudentIdentity;
  onStudentChange: (student: StudentIdentity) => void;
}

export function StudentSelector({
  currentStudent,
  onStudentChange,
}: StudentSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customName, setCustomName] = useState(currentStudent.name);
  const [customId, setCustomId] = useState(currentStudent.studentId);

  useEffect(() => {
    setCustomName(currentStudent.name);
    setCustomId(currentStudent.studentId);
  }, [currentStudent]);

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim() && customId.trim()) {
      onStudentChange({
        name: customName.trim(),
        studentId: customId.trim(),
      });
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
          <User className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Active Student Identity
          </div>
          <div className="font-medium text-neutral-900 dark:text-neutral-100">
            {currentStudent.name}{" "}
            <span className="text-xs font-normal text-neutral-500">
              ({currentStudent.studentId})
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Preset selector pills */}
        <div className="hidden items-center gap-1 sm:flex">
          {PRESET_STUDENTS.map((preset) => {
            const isSelected =
              preset.studentId === currentStudent.studentId &&
              preset.name === currentStudent.name;
            return (
              <button
                key={preset.studentId}
                type="button"
                onClick={() => onStudentChange(preset)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                }`}
              >
                {preset.name.split(" ")[0]}
              </button>
            );
          })}
        </div>

        {/* Custom Edit Modal/Toggle */}
        {isEditing ? (
          <form onSubmit={handleSaveCustom} className="flex items-center gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Name"
              className="h-8 w-28 rounded border border-neutral-300 bg-white px-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              required
            />
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder="ID (e.g. 20-40532)"
              className="h-8 w-28 rounded border border-neutral-300 bg-white px-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              required
            />
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded bg-emerald-600 text-white hover:bg-emerald-700"
              title="Save Identity"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 rounded border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <Edit2 className="h-3 w-3" />
            <span>Custom</span>
          </button>
        )}
      </div>
    </div>
  );
}

// src/components/ActionsDropdown.tsx
import { useState, useEffect, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface ActionItem {
  label: string;
  onClick: () => void;
  isDestructive?: boolean;
}

interface ActionsDropdownProps {
  items: ActionItem[];
}

export const ActionsDropdown = ({ items }: ActionsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <MoreHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 z-10 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => handleItemClick(item.onClick)}
                className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                  item.isDestructive
                    ? 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

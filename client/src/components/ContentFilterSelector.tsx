import { Shield, Eye, Flame, CheckCircle2 } from 'lucide-react';
import type { ContentFilter } from '@/types';

interface ContentFilterSelectorProps {
  value: ContentFilter;
  onChange: (filter: ContentFilter) => void;
  className?: string;
}

const filterOptions = [
  {
    value: 'sfw' as ContentFilter,
    label: 'SFW Only',
    icon: Shield,
    description: 'Family-friendly content only',
    color: 'from-green-500 to-emerald-500',
    borderColor: 'border-green-500/50',
    bgColor: 'bg-green-500/10',
  },
  {
    value: 'all' as ContentFilter,
    label: 'All Content',
    icon: Eye,
    description: 'Both SFW and NSFW',
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-500/50',
    bgColor: 'bg-purple-500/10',
  },
  {
    value: 'nsfw' as ContentFilter,
    label: 'NSFW Only',
    icon: Flame,
    description: 'Adult content only (18+)',
    color: 'from-red-500 to-orange-500',
    borderColor: 'border-red-500/50',
    bgColor: 'bg-red-500/10',
  },
];

export default function ContentFilterSelector({ value, onChange, className = '' }: ContentFilterSelectorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {filterOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? `${option.borderColor} ${option.bgColor} shadow-lg`
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected
                    ? `bg-gradient-to-br ${option.color} shadow-lg`
                    : 'bg-white/10'
                }`}
              >
                <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {option.label}
                  </h3>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs text-white font-medium">
                      Active
                    </span>
                  )}
                </div>
                <p className={`text-sm ${isSelected ? 'text-gray-200' : 'text-gray-400'}`}>
                  {option.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

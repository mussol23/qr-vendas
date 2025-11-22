import React from 'react';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'brand' | 'white' | 'gray';
};

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', color = 'brand' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  const colorClasses = {
    brand: 'bg-brand-500',
    white: 'bg-white',
    gray: 'bg-gray-500'
  };

  const centerColorClasses = {
    brand: 'bg-brand-600',
    white: 'bg-white',
    gray: 'bg-gray-600'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Bolinhas orbitando */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            animation: `spin-spinner 1.2s linear infinite`,
            animationDelay: `${i * 0.15}s`,
          }}
        >
          <div
            className={`${dotSizes[size]} rounded-full ${colorClasses[color]} absolute top-0 left-1/2 -translate-x-1/2`}
            style={{
              opacity: 1 - (i * 0.12),
            }}
          />
        </div>
      ))}
      
      {/* Círculo central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={`${size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-6 h-6'} rounded-full ${centerColorClasses[color]} animate-pulse`}
        />
      </div>

      <style>{`
        @keyframes spin-spinner {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Spinner;


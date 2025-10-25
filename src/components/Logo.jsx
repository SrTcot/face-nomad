import { Leaf } from 'lucide-react';

export default function Logo({ size = 'large', showText = true }) {
  const sizes = {
    small: { icon: 'w-8 h-8', text: 'text-xl' },
    large: { icon: 'w-16 h-16', text: 'text-4xl' }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className={`${sizes[size].icon} bg-campo-green-500 rounded-full flex items-center justify-center`}>
          <Leaf className="w-2/3 h-2/3 text-white" />
        </div>
        <div className="absolute inset-0 bg-campo-green-400 rounded-full blur-sm opacity-50"></div>
      </div>
      {showText && (
        <div>
          <h1 className={`${sizes[size].text} font-bold text-campo-green-700`}>
            FaceNomad
          </h1>
          {size === 'large' && (
            <p className="text-campo-brown-600 text-sm mt-1">Sistema de Reconocimiento Facial</p>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <div className="relative w-16 h-16 mb-4">
        {/* Animated outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-amber-900/10 border-t-amber-950 animate-spin"></div>
      </div>
      <h2 className="text-xl font-semibold text-amber-950/80 animate-pulse">
        Cargando delicioso sabor...
      </h2>
      <p className="text-sm text-amber-900/60 mt-2">
        Por favor, espera un momento.
      </p>
    </div>
  );
}

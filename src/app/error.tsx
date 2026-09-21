'use client';

import React, { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error Boundary caught an exception:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-16 h-16 bg-amber-900/10 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-amber-950"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-amber-950 mb-2">
        ¡Ups! Algo no ha salido como esperábamos
      </h2>
      
      <p className="text-amber-900/70 max-w-md mb-6">
        Ha ocurrido un error inesperado al procesar la solicitud. No te preocupes, puedes intentar recargar la sección.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 bg-amber-950 text-[#F3E8CC] font-semibold rounded-lg hover:bg-amber-900 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-amber-950 focus:ring-offset-2"
        >
          Intentar de nuevo
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2.5 bg-amber-900/10 text-amber-950 font-semibold rounded-lg hover:bg-amber-900/20 transition-colors focus:outline-none"
        >
          Ir al Inicio
        </button>
      </div>
    </div>
  );
}

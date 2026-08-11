'use client';

import { useState, useEffect } from 'react';
import { X, Flame, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CampaignData {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  media_type: 'IMAGE' | 'VIDEO';
  image_url: string | null;
  video_url: string | null;
  promo_price: number | null;
  button_text: string;
  button_url: string;
  display_frequency: 'ONCE_PER_SESSION' | 'ONCE_PER_DAY' | 'ALWAYS';
}

interface PromoModalProps {
  campaign?: CampaignData | null;
}

export function PromoModal({ campaign }: PromoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!campaign) return;

    const freq = campaign.display_frequency || 'ONCE_PER_SESSION';
    let shouldShow = false;

    if (freq === 'ALWAYS') {
      shouldShow = true;
    } else if (freq === 'ONCE_PER_SESSION') {
      shouldShow = !sessionStorage.getItem('esquina51_promo_seen');
    } else if (freq === 'ONCE_PER_DAY') {
      const lastSeen = localStorage.getItem('esquina51_promo_date');
      const today = new Date().toISOString().split('T')[0];
      shouldShow = lastSeen !== today;
    }

    if (shouldShow) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [campaign]);

  const handleClose = () => {
    if (campaign) {
      const freq = campaign.display_frequency || 'ONCE_PER_SESSION';
      if (freq === 'ONCE_PER_SESSION') {
        sessionStorage.setItem('esquina51_promo_seen', 'true');
      } else if (freq === 'ONCE_PER_DAY') {
        localStorage.setItem('esquina51_promo_date', new Date().toISOString().split('T')[0]);
      }
    }
    setIsOpen(false);
  };

  if (!isOpen || !campaign) return null;

  const fmtPrice = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
  const imageUrl = campaign.image_url || '/images/products/box-mini-monster.png';
  const hasVideo = campaign.media_type === 'VIDEO' && campaign.video_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-up">
      <div 
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border-2"
        style={{ backgroundColor: '#FFF7E5', borderColor: '#B88727' }}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full transition-colors shadow"
          style={{ backgroundColor: 'rgba(58,36,24,0.85)', color: '#FFF7E5' }}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        {/* Media section (Image top on mobile, left on desktop) */}
        <div className="relative w-full md:w-1/2 h-56 md:h-auto min-h-[240px] overflow-hidden flex-shrink-0" style={{ backgroundColor: '#F3E8CC' }}>
          {hasVideo ? (
            <video
              src={campaign.video_url!}
              autoPlay
              muted
              playsInline
              loop
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={imageUrl}
              alt={campaign.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              priority
            />
          )}
        </div>

        {/* Content section (Bottom on mobile, right on desktop) */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-4 text-center md:text-left">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono" style={{ backgroundColor: 'rgba(184,135,39,0.15)', border: '1px solid rgba(184,135,39,0.3)', color: '#B88727' }}>
              <Flame size={13} /> PROMOCIÓN DESTACADA
            </div>

            <h2 
              className="text-2xl md:text-3xl font-bold leading-tight uppercase tracking-wide"
              style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}
            >
              {campaign.title}
            </h2>

            {campaign.subtitle && (
              <p className="text-xs font-medium uppercase tracking-wide font-mono" style={{ color: '#A94F2F' }}>
                {campaign.subtitle}
              </p>
            )}

            {campaign.description && (
              <p className="text-xs leading-relaxed" style={{ color: '#65513F' }}>
                {campaign.description}
              </p>
            )}

            {campaign.promo_price && (
              <div className="pt-1">
                <span className="text-[10px] uppercase tracking-widest block font-mono" style={{ color: '#65513F' }}>Precio Especial</span>
                <span className="text-4xl font-bold tracking-tight font-mono" style={{ color: '#A94F2F' }}>
                  {fmtPrice(campaign.promo_price)}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link
              href={campaign.button_url || '/menu'}
              onClick={handleClose}
              className="py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md"
              style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}
            >
              <ShoppingBag size={15} /> {campaign.button_text || 'PEDIR AHORA'}
            </Link>

            <Link
              href="/menu"
              onClick={handleClose}
              className="py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: '#F3E8CC', color: '#3A2418', border: '1px solid #D4C4A0', fontFamily: 'Oswald, sans-serif' }}
            >
              VER MENÚ <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { IconChevronLeft } from "./Icons";
import SidebarIcon from "./SidebarIcon";

const WHITE = '#FFFFFF';

export default function SidebarExpandedHeader({
  bannerUrl,
  backgroundFallback,
  showBannerOverlay = false,
  avatarSrc,
  avatarAlt,
  userName,
  nameFallback,
  avatarFallback,
  subtitle,
  onCollapse,
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarSrc]);

  return (
    <div style={{
      flexShrink: 0,
      margin: '-16px -14px 10px -14px',
      width: 'calc(100% + 28px)',
      borderRadius: '0',
      background: bannerUrl
        ? `url(${bannerUrl}) center/cover no-repeat`
        : backgroundFallback,
      padding: '10px 14px',
      position: 'relative',
    }}>
      {showBannerOverlay && bannerUrl && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          {avatarSrc && !imgError ? (
            <img
              src={avatarSrc}
              alt={avatarAlt}
              onError={() => setImgError(true)}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.5)', flexShrink: 0,
              }}
            />
          ) : (
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, color: WHITE, textTransform: 'uppercase', fontSize: '1rem',
            }}>
              {(userName || avatarFallback).charAt(0)}
            </div>
          )}
          <button
            onClick={onCollapse}
            style={{
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
              color: WHITE, width: '26px', height: '26px', borderRadius: '6px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Contraer menú"
          >
            <SidebarIcon Icon={IconChevronLeft} size={15} />
          </button>
        </div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: WHITE, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
          {userName || nameFallback}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { SvgIcon, type SvgIconProps } from '@mui/material';

// Контурные значки на сетке 24, в том же духе, что outlined-иконки MUI.
// Библиотека проекта таких силуэтов не содержит — см. projectAppearance.ts.

function KnitIcon({ children, ...props }: SvgIconProps & { children: ReactNode }) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" sx={{
      fill: 'none',
      '& path, & circle, & ellipse, & line': {
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
      },
      '& .knit-fill': { fill: 'currentColor', stroke: 'none' },
      ...props.sx,
    }}>
      {children}
    </SvgIcon>
  );
}

export function GarmentIcon(props: SvgIconProps) {
  return (
    <KnitIcon {...props}>
      <circle cx="12" cy="5.2" r="1.7" />
      <path d="M12 6.9 5.2 13.2h13.6L12 6.9z" />
      <path d="M6.1 13.2c.15 1.35.85 2 1.9 2h8c1.05 0 1.75-.65 1.9-2" />
    </KnitIcon>
  );
}

export function SweaterIcon(props: SvgIconProps) {
  return (
    <KnitIcon {...props}>
      <path d="M9 7.6C9 5.9 10.2 4.7 12 4.7s3 1.2 3 2.9v.8l3.4 1.3c.7.3 1.2 1 1.2 1.8V15h-2.3v5.2H6.7V15H4.4v-3.5c0-.8.5-1.5 1.2-1.8L9 8.4z" />
      <path d="M10.2 7.5c.3 1.05 1 1.7 1.8 1.7s1.5-.65 1.8-1.7" />
      <path d="M7.2 17.4h9.6M7.2 19h9.6M5.1 13.3h1.9M17 13.3h1.9" />
    </KnitIcon>
  );
}

export function VestIcon(props: SvgIconProps) {
  return (
    <KnitIcon {...props}>
      <path d="M9.2 6.4C9.2 5 10.3 4.1 12 4.1s2.8.9 2.8 2.3v1.2c1.7.7 3 2.1 3 3.8v7.8H6.2v-7.8c0-1.7 1.3-3.1 3-3.8z" />
      <path d="M10.3 6.2c.25.95.9 1.55 1.7 1.55s1.45-.6 1.7-1.55" />
      <path d="M12 9.2v9.6" />
    </KnitIcon>
  );
}

export function HatIcon(props: SvgIconProps) {
  return (
    <KnitIcon {...props}>
      <circle cx="12" cy="3.3" r="1.35" />
      <path d="M12 4.65v.85" />
      <path d="M7.3 12.4C7.3 8.7 9.2 6 12 6s4.7 2.7 4.7 6.4v1.1H7.3z" />
      <path d="M5.7 13.5h12.6v2.7c0 1.05-.85 1.9-1.9 1.9H7.6c-1.05 0-1.9-.85-1.9-1.9z" />
      <path d="M6.2 15.6h11.6" />
    </KnitIcon>
  );
}

export function ScarfIcon(props: SvgIconProps) {
  return (
    <KnitIcon {...props}>
      <path d="M8.2 7.3c0-1.7 1.7-2.8 3.8-2.8s3.8 1.1 3.8 2.8-1.7 2.7-3.8 2.7-3.8-1-3.8-2.7z" />
      <path d="M9.1 9.2c-.2 3.2-.7 6.6-.5 9.2M14.6 9c.4 3.3 1.1 6.4 1.4 9.1" />
      <path d="M7.4 18.4v2.1M8.7 18.4v2.4M10 18.4v2.1M14.6 18.1v2.1M15.9 18.1v2.4M17.2 18.1v2.1" />
    </KnitIcon>
  );
}

export function ShawlIcon(props: SvgIconProps) {
  return (
    <KnitIcon {...props}>
      <path d="M3.8 7.4h16.4L12 18.6z" />
      <path d="M7.4 10.2h9.2" />
      <path d="M6.6 8.6 5.5 10.2M9.2 12.4 8.1 14M12 16.6v1.8M14.8 12.4l1.1 1.6M17.4 8.6l1.1 1.6" />
    </KnitIcon>
  );
}

export function SocksIcon(props: SvgIconProps) {
  return (
    <KnitIcon {...props}>
      <path d="M4.3 4.2h3v8.4h3.3v2.5H4.3V12c0-.9.5-1.5.5-2.4V4.2z" />
      <path d="M4.7 6.5h2.2" />
      <path d="M13.1 4.2h3v8.4h3.3v2.5H13.1V12c0-.9.5-1.5.5-2.4V4.2z" />
      <path d="M13.5 6.5h2.2" />
    </KnitIcon>
  );
}

export function MittensIcon(props: SvgIconProps) {
  return (
    <KnitIcon {...props}>
      <path d="M8.4 20.4V7.1c0-1.35 1.1-2.45 2.45-2.45h2.5c1.35 0 2.45 1.1 2.45 2.45v1.35c1.45.2 2.55 1.35 2.55 2.75v1.7c0 1.2-.9 2.2-2.1 2.35v4.7c0 1.2-.95 2.15-2.15 2.15h-3.55c-1.2 0-2.15-.95-2.15-2.15z" />
      <path d="M8.6 16.3h7.6M8.6 18h7.6" />
    </KnitIcon>
  );
}

export function BlanketIcon(props: SvgIconProps) {
  return (
    <KnitIcon {...props}>
      <path d="M4 7.2h16v9.2H4z" />
      <path d="M4 11.2h16" />
      <path d="M16.2 7.2 20 11" />
      <path d="M6.2 16.4v2.2M9.4 16.4v2.2M12.6 16.4v2.2M15.8 16.4v2.2M19 16.4v2.2" />
    </KnitIcon>
  );
}

export function ToyIcon(props: SvgIconProps) {
  return (
    <KnitIcon {...props}>
      <circle cx="8.3" cy="6.4" r="1.7" />
      <circle cx="15.7" cy="6.4" r="1.7" />
      <circle cx="12" cy="13.4" r="6" />
      <circle className="knit-fill" cx="10" cy="12.5" r="0.7" />
      <circle className="knit-fill" cx="14" cy="12.5" r="0.7" />
      <path d="M10.2 15.3c.7.8 2.9.8 3.6 0" />
    </KnitIcon>
  );
}

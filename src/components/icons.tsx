/* 手绘内联 SVG 图标 —— 统一 24 viewBox / stroke 1.7 */

import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

export const LogoMark = ({ size = 26, ...rest }: P) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...rest}>
    <rect x="1.2" y="1.2" width="29.6" height="29.6" rx="7" stroke="#31493a" strokeWidth="1.6" fill="#101a15" />
    <path d="M12 9.5l-5 6.5 5 6.5" stroke="#56d364" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 9.5l5 6.5-5 6.5" stroke="#56d364" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="23.6" cy="23.6" r="4.2" stroke="#ffc266" strokeWidth="1.9" fill="#0c1310" />
    <path d="M22 23.6h3.2M23.6 22v3.2" stroke="#ffc266" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const StarIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.6l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6L12 16.2 6.9 19l1.1-5.6-4.2-3.9 5.7-.7L12 3.6z" />
  </svg>
);

export const ForkIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6.5" cy="5.5" r="2.2" />
    <circle cx="17.5" cy="5.5" r="2.2" />
    <circle cx="12" cy="18.5" r="2.2" />
    <path d="M6.5 7.7v1.8a3 3 0 0 0 3 3h5a3 3 0 0 0 3-3V7.7M12 12.5v3.8" />
  </svg>
);

export const EyeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const IssueIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
  </svg>
);

export const FolderIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 7.2V18a1.5 1.5 0 0 0 1.5 1.5h14A1.5 1.5 0 0 0 20.5 18V9a1.5 1.5 0 0 0-1.5-1.5h-8L9 5.2A1.5 1.5 0 0 0 7.9 4.7H5A1.5 1.5 0 0 0 3.5 6.2v1z" />
    <path d="M3.5 10h17" opacity="0.55" />
  </svg>
);

export const FileIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 3.5h8L19 8.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 0 6 19V3.5z" />
    <path d="M13.5 3.5V9H19" />
  </svg>
);

export const BranchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6.5" cy="6" r="2.2" />
    <circle cx="6.5" cy="18" r="2.2" />
    <circle cx="17.5" cy="8" r="2.2" />
    <path d="M6.5 8.2v7.6M17.5 10.2c0 3.4-3.2 4-6.5 4.3-2 .2-3.6.8-4.3 2" />
  </svg>
);

export const BookIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5z" />
    <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20M8.5 7.5h7M8.5 11h4.5" opacity="0.8" />
  </svg>
);

export const PulseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 12h4l2.5-6.5 4 13L15.5 12h6" />
  </svg>
);

export const UsersIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5" />
    <path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.9M17.8 14.9c1.8.7 2.9 2.2 3.2 4.6" opacity="0.7" />
  </svg>
);

export const ArrowLeftIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const ExternalIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5V14M14 4.5h5.5V10M19 5l-8.5 8.5" />
  </svg>
);

export const CopyIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
    <path d="M5.5 14.5h-.75A1.75 1.75 0 0 1 3 12.75v-8A1.75 1.75 0 0 1 4.75 3h8A1.75 1.75 0 0 1 14.5 4.75v.75" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12.5l5 5L19.5 6.5" />
  </svg>
);

export const TerminalIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M7 9.5l3.5 3L7 15.5M12.5 15.5H17" />
  </svg>
);

export const GlobeIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c-4.5 4.7-4.5 12.3 0 17 4.5-4.7 4.5-12.3 0-17z" />
  </svg>
);

export const PinIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.3" />
  </svg>
);

export const TagIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 10.5v-6a1 1 0 0 1 1-1h6L20.5 13a1.4 1.4 0 0 1 0 2l-5.5 5.5a1.4 1.4 0 0 1-2 0L3.5 10.5z" />
    <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const ScaleIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v16M7 20h10M12 6.5L5.5 8M12 6.5L18.5 8" />
    <path d="M3 13.5L5.5 8 8 13.5a2.7 2.7 0 0 1-5 0zM16 13.5L18.5 8 21 13.5a2.7 2.7 0 0 1-5 0z" />
  </svg>
);

export const ClockIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.2l3.4 2" />
  </svg>
);

export const WarnIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5L22 20H2L12 3.5z" />
    <path d="M12 9.5v5M12 17.2v.3" />
  </svg>
);

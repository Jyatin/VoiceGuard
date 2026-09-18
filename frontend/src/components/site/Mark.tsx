export function Mark({ size = 18, tone = 'currentColor' }: { size?: number; tone?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M10 1.5 3 4v6.2C3 14.3 6.1 17.3 10 18.5c3.9-1.2 7-4.2 7-8.3V4l-7-2.5Z"
        fill="none"
        stroke={tone}
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M6 10h1.1l.7-2.6L9 13l1-7.4 1 5.9.8-1.5h1.2"
        fill="none"
        stroke={tone}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

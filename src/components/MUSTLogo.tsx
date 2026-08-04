export function MUSTLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Mbeya University of Science and Technology"
    >
      <circle cx="256" cy="256" r="248" fill="#14763b" stroke="#14763b" strokeWidth="16" />
      <circle cx="256" cy="256" r="220" fill="white" />
      <circle cx="256" cy="256" r="200" fill="#14763b" />
      <path
        d="M160 200 L256 120 L352 200 L352 340 L256 380 L160 340 Z"
        fill="white"
        stroke="white"
        strokeWidth="4"
      />
      <text
        x="256"
        y="310"
        textAnchor="middle"
        fill="#14763b"
        fontFamily="Geist, system-ui, sans-serif"
        fontWeight="bold"
        fontSize="72"
        letterSpacing="4"
      >
        MUST
      </text>
    </svg>
  );
}

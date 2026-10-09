export function AnimatedNumber({ value }: { value: number }) {
  return (
    <span
      key={value}
      className="inline-block motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-reduce:animate-none"
    >
      {value}
    </span>
  )
}

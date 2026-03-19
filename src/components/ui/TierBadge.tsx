export function TierBadge({ tier }: { tier: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
      {tier}
    </span>
  )
}

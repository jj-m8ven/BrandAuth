function getScoreColor(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-700'
  if (score >= 60) return 'bg-yellow-100 text-yellow-700'
  if (score >= 40) return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

export function M8venPassportBadge({ score }: { score: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getScoreColor(score)}`}
    >
      M8ven {score}
    </span>
  )
}

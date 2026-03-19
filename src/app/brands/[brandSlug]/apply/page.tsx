'use client'

import { ApplyForm } from '@/app/vendor/apply/[brandSlug]/page'

export default function PublicApplyPage() {
  return <ApplyForm authenticated={false} />
}

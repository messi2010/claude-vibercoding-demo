'use client'
import { useState } from 'react'

interface ExpandableDescriptionProps {
  text: string
}

const LINE_THRESHOLD = 4

export function ExpandableDescription({ text }: ExpandableDescriptionProps) {
  const [expanded, setExpanded] = useState(false)
  const lines = text.split('\n')
  const needsTruncation = lines.length > LINE_THRESHOLD || text.length > 300

  return (
    <div className="mb-6">
      <p
        className={`text-gray-300 leading-relaxed whitespace-pre-wrap ${
          !expanded && needsTruncation ? 'line-clamp-4' : ''
        }`}
      >
        {text}
      </p>
      {needsTruncation && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-accent text-sm mt-1 hover:underline"
        >
          {expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  )
}

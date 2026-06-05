'use client'
import Link from 'next/link'
import Image from 'next/image'
import type { ReadingProgress } from '@truyen/types'

interface ContinueReadingProps {
  progress: ReadingProgress[]
}

export function ContinueReading({ progress }: ContinueReadingProps) {
  if (progress.length === 0) return null

  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-4">Tiếp Tục Đọc</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {progress.map((item) => (
          <Link
            key={item.id}
            href={`/stories/${item.story?.slug ?? item.storyId}/chapters/${item.chapter?.number ?? 1}`}
            className="flex-shrink-0 w-28 group"
          >
            <div className="relative w-28 h-40 bg-deep rounded-lg overflow-hidden">
              {item.story?.coverImage ? (
                <Image
                  src={item.story.coverImage}
                  alt={item.story.title ?? ''}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl">📖</div>
              )}
            </div>
            <p className="text-xs text-gray-300 mt-1 line-clamp-2 group-hover:text-accent transition-colors">
              {item.story?.title ?? 'Truyện'}
            </p>
            <p className="text-xs text-gray-500">Ch.{item.chapter?.number ?? '?'}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

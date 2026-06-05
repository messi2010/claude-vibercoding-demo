import Link from 'next/link'

export function AgeGate() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-surface border border-accent rounded-2xl p-8 max-w-md w-full">
        <div className="text-5xl mb-4">🔞</div>
        <h2 className="text-2xl font-bold text-white mb-2">Nội dung 18+</h2>
        <p className="text-gray-400 mb-6">
          Bạn cần xác minh độ tuổi để xem nội dung này. Vui lòng cập nhật thông tin ngày sinh.
        </p>
        <Link
          href="/auth/complete-profile"
          className="inline-block bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Xác minh tuổi ngay
        </Link>
      </div>
    </div>
  )
}

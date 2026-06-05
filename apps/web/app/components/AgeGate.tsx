import Link from 'next/link'

interface AgeGateProps {
  loggedIn: boolean
}

export function AgeGate({ loggedIn }: AgeGateProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-surface border border-accent rounded-2xl p-8 max-w-md w-full">
        <div className="text-5xl mb-4">🔞</div>
        <h2 className="text-2xl font-bold text-white mb-2">Nội dung 18+</h2>
        <p className="text-gray-400 mb-6">
          {loggedIn
            ? 'Bạn cần xác minh độ tuổi để xem nội dung này. Vui lòng cập nhật thông tin ngày sinh.'
            : 'Bạn cần đăng nhập và xác minh độ tuổi để xem nội dung này.'}
        </p>
        <Link
          href={loggedIn ? '/auth/complete-profile' : '/auth/login'}
          className="inline-block bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          {loggedIn ? 'Xác minh tuổi ngay' : 'Đăng nhập'}
        </Link>
      </div>
    </div>
  )
}

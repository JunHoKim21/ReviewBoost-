import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ReviewBoost - 리뷰를 인스타그램 카드뉴스로',
  description: '스마트스토어 리뷰 텍스트를 AI로 요약하여 감성 인포그래픽 카드뉴스 이미지로 3초만에 변환하세요.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

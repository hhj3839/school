import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'꼭꼭아지트 · 3D 위장 숨바꼭질',description:'사람형 캐릭터에 직접 무늬를 그리고, 3D 미술실에서 자세를 맞춰 숨어요.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><body>{children}</body></html>;}


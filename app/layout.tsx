import type { Metadata } from 'next';
import './globals.css';
import './pastel.css';
export const metadata: Metadata={title:'꼭꼭 아지트 · 함께하는 놀이방',description:'이름을 쓰고 게임을 골라요. 친구들과 숨바꼭질과 블록 대결을 함께 즐기는 태블릿 놀이방.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><body>{children}</body></html>;}

 

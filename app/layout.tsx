import type { Metadata } from 'next';
import './globals.css';
import './ui-system.css';
import './pastel.css';
import './tablet-landscape.css';
import './race/style.css';
import './classroom-style.css';
import './blocks/tablet-size.css';
import './ui-system.css';
export const metadata: Metadata={title:'꼭꼭 아지트 · 함께하는 놀이방',description:'이름을 쓰고 게임을 골라요. 친구들과 숨바꼭질, 블록 대결, 우당탕 운동회를 함께 즐기는 태블릿 놀이방.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><head><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"/></head><body>{children}</body></html>;}

 
 

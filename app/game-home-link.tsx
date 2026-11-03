'use client';
import type {ComponentProps} from 'react';

export function GameHomeLink(props:Omit<ComponentProps<'a'>,'href'>){
  // Leaving a game must tear down its simulation and polling. The current
  // Vinext Worker build also fails RSC navigation through next/link at runtime.
  // eslint-disable-next-line @next/next/no-html-link-for-pages -- Intentional full-document navigation at the game boundary.
  return <a {...props} href="/"/>;
}

'use client'
import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

export default function Button({ variant = 'primary', children, ...props }: Props) {
  const base = 'px-4 py-2 rounded-2xl text-sm font-medium focus:outline-none'
  const style = variant === 'primary' ? 'bg-[rgb(var(--wkt3-primary))] text-white' : 'bg-transparent'
  return (
    <button className={`${base} ${style}`} {...props}>
      {children}
    </button>
  )
}
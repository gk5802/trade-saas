'use client'
import React from 'react'

export default function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className="px-3 py-2 border rounded-lg text-sm w-full" />
  )
}
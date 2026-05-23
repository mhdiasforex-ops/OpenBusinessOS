"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
}

function DropdownMenu({ children }: DropdownMenuProps) {
  return <>{children}</>
}

function DropdownMenuTrigger({ className, children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn("", className)} onClick={onClick} {...props}>
      {children}
    </button>
  )
}

function DropdownMenuContent({ className, children, align = "end", ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: string }) {
  return (
    <div className={cn("absolute right-0 z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-background p-1 text-foreground shadow-md", className)} {...props}>
      {children}
    </div>
  )
}

function DropdownMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted", className)} {...props} />
  )
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator }

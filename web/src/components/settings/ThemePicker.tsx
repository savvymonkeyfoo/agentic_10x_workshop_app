"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useStyle } from "@/components/providers/style-provider"
import { cn } from "@/lib/utils"

import { themes } from "@/config/themes"

export function ThemePicker() {
    const { setTheme, theme } = useTheme()
    const { style, setStyle } = useStyle()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[340px] p-4">
                <div className="space-y-4">

                    {/* Mode Selection */}
                    <div className="space-y-2">
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-0">APPEARANCE</DropdownMenuLabel>
                        <div className="grid grid-cols-3 gap-2">
                            {(['light', 'dark', 'system'] as const).map((mode) => (
                                <div
                                    key={mode}
                                    onClick={() => setTheme(mode)}
                                    className={cn(
                                        "flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-sm font-medium cursor-pointer transition-all hover:bg-muted/50",
                                        theme === mode
                                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                                            : "border-border bg-transparent text-foreground"
                                    )}
                                >
                                    {mode === 'light' && <Sun className="h-4 w-4" />}
                                    {mode === 'dark' && <Moon className="h-4 w-4" />}
                                    {mode === 'system' && <span className="text-xs">💻</span>}
                                    <span className="capitalize">{mode}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DropdownMenuSeparator className="bg-border/50" />

                    {/* Style Selection */}
                    <div className="space-y-2">
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-0">THEME STYLE</DropdownMenuLabel>
                        <div className="grid grid-cols-1 gap-2">
                            {themes.map((item) => (
                                <div
                                    key={item.value}
                                    onClick={() => setStyle(item.value as any)}
                                    className={cn(
                                        "relative flex items-center justify-between px-3 py-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                                        style === item.value
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                            : "border-border"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn("h-8 w-8 rounded-full shadow-sm flex items-center justify-center", item.color)}>
                                            {style === item.value && <div className="h-2.5 w-2.5 bg-white rounded-full" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold">{item.label}</span>
                                            <span className="text-xs text-muted-foreground">{item.description}</span>
                                        </div>
                                    </div>

                                    {style === item.value && (
                                        <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                                            ✓
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

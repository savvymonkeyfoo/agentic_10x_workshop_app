"use client"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Settings2 } from "lucide-react"
import { ThemePicker } from "./ThemePicker"

export function SettingsSheet() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                    <Settings2 className="h-5 w-5" />
                    <span className="sr-only">Open settings</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Appearance</SheetTitle>
                    <SheetDescription>
                        Customize the look and feel of the workspace.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6">
                    <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">Theme Presets</h3>
                    <ThemePicker />
                </div>
            </SheetContent>
        </Sheet>
    )
}

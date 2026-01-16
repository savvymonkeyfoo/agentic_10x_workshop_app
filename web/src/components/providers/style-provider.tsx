"use client"

import * as React from "react"

type Style = "capgemini" | "claude" | "linear"

interface StyleProviderProps {
    children: React.ReactNode
    defaultStyle?: Style
    storageKey?: string
}

interface StyleProviderState {
    style: Style
    setStyle: (style: Style) => void
}

const initialState: StyleProviderState = {
    style: "capgemini",
    setStyle: () => null,
}

const StyleProviderContext = React.createContext<StyleProviderState>(initialState)

export function StyleProvider({
    children,
    defaultStyle = "capgemini",
    storageKey = "agentic-ui-style",
    ...props
}: StyleProviderProps) {
    const [style, setStyle] = React.useState<Style>(defaultStyle)

    React.useEffect(() => {
        const savedStyle = localStorage.getItem(storageKey) as Style
        if (savedStyle) {
            setStyle(savedStyle)
        }
    }, [storageKey])

    React.useEffect(() => {
        const root = window.document.documentElement
        root.setAttribute("data-theme", style)
        localStorage.setItem(storageKey, style)
    }, [style, storageKey])

    const value = {
        style,
        setStyle,
    }

    return (
        <StyleProviderContext.Provider {...props} value={value}>
            {children}
        </StyleProviderContext.Provider>
    )
}

export const useStyle = () => {
    const context = React.useContext(StyleProviderContext)

    if (context === undefined) {
        throw new Error("useStyle must be used within a StyleProvider")
    }

    return context
}

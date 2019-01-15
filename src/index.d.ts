import Grapnel from './grapnel'

declare module './grapnel' {
    
    export interface GrapnelOptions {
        pushState?: boolean
        hashBang?: boolean
        isWindow?: boolean
        target?: any
        root?: string
    }

    export interface NavigateOptions {
        title?: string
        state?: any
    }
}

declare module './route' {

    export interface ParsedRoute {
        params: any
        keys: { name: string; optional: boolean }[]
        matches: string[]
        match: string[]
    }

    export type AcceptedPath = string | string[] | RegExp
}

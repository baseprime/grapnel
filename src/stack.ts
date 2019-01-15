import Grapnel from './grapnel'

export default class MiddlewareStack {
    stack: any[]
    router: Grapnel
    runCallback: boolean = true
    callbackRan: boolean = true
    propagateEvent: boolean = true
    value: string
    req: any
    previousState: any
    timeStamp: Number

    static global: any[] = []

    constructor(router: Grapnel, extendObj?: any) {
        this.stack = MiddlewareStack.global.slice(0)
        this.router = router
        this.value = router.path()

        Object.assign(this, extendObj)

        return this
    }

    preventDefault() {
        this.runCallback = false
    }

    stopPropagation() {
        this.propagateEvent = false
    }

    parent() {
        let hasParentEvents = !!(this.previousState && this.previousState.value && this.previousState.value == this.value)
        return hasParentEvents ? this.previousState : false
    }

    callback() {
        this.callbackRan = true
        this.timeStamp = Date.now()
        this.next()
    }

    enqueue(handler: any, atIndex?: number) {
        let handlers = !Array.isArray(handler) ? [handler] : atIndex < handler.length ? handler.reverse() : handler

        while (handlers.length) {
            this.stack.splice(atIndex || this.stack.length + 1, 0, handlers.shift())
        }

        return this
    }

    next() {
        return this.stack.shift().call(this.router, this.req, this, () => this.next())
    }
}

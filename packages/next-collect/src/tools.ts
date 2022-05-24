export function removeSuffix(str: string, suffix: string | string[]): string {
  const suffixes = typeof suffix === "string" ? [suffix] : suffix
  for (const suff of suffixes) {
    while (str.lastIndexOf(suff) === str.length - suff.length) {
      str = str.substring(0, str.length - suff.length)
    }
  }
  return str
}

export type SanitizeOjectOpts = {
  //What to do with undefined values? remove (default) - remove them, toNull - conver to nulls
  undefs?: "remove" | "toNull"
  removeFunctions?: false
}

/**
 * Removes all undefined values from object tree
 */
export function sanitizeObject(object: any, opts: SanitizeOjectOpts = {}): any {
  const { undefs = "remove", removeFunctions = false } = opts
  if (object === null) {
    throw new Error(`sanitizeObject(null) can't be called`)
  }
  if (typeof object !== "object") {
    throw new Error(`Wrong type ${typeof object} - expected object`)
  }

  if (Array.isArray(object)) {
    return (undefs === "remove" ? object.filter(element => element !== undefined) : object).map(element => {
      if (element === undefined) {
        return null
      } else if (typeof element === "object") {
        return sanitizeObject(element, opts)
      } else {
        return element
      }
    })
  }

  return (
    undefs === "remove" ? Object.entries(object).filter(([, value]) => value !== undefined) : Object.entries(object)
  ).reduce((res, [key, value]) => {
    if (value === undefined || value === null) {
      return { ...res, [key]: null }
    } else if (typeof value === "object") {
      return { ...res, [key]: sanitizeObject(value, opts) }
    } else {
      return { ...res, [key]: value }
    }
  }, {})
}

export function renameProps(obj: any, rename: Record<keyof any, keyof any>) {
  return Object.entries(obj).reduce((res, [key, value]) => ({ ...res, [rename[key] || key]: value }), {})
}

export function removeProps<T extends keyof any = string>(
  obj: Record<keyof any, any>,
  ...props: T[]
): Record<keyof any, any> {
  const propSet = new Set<T>(props)
  return Object.entries(obj)
    .filter(([key]) => propSet.has(key as T))
    .reduce((res, [key, value]) => ({ ...res, [key]: value }), {} as Record<T, any>)
}

export type PrefixMap<T> = {
  get(element: string): T | undefined
}

function lastIndexOrFail(str: string, search: string): number | undefined {
  const lastPosition = str.lastIndexOf(search)
  if (lastPosition >= 0) {
    if (str.lastIndexOf(search, lastPosition - 1) >= 0) {
      throw new Error(`Invalid pattern ${str}. So far we support only one wildcard that should be at the end of URL`)
    }
  }
  return lastPosition >= 0 ? lastPosition : undefined
}

export function createPrefixMap<T>(map: [string, T][]): PrefixMap<T> {
  const prefixes: [string, T][] = []
  const fullUrls: Map<string, T> = new Map<string, T>()
  for (const [key, val] of map) {
    const wildcardIndex = lastIndexOrFail(key, "*")
    if (wildcardIndex) {
      prefixes.push([key.substring(0, wildcardIndex - 1), val])
    } else {
      fullUrls.set(key, val)
    }
  }
  return {
    get(element: string) {
      const fullMatch = fullUrls.get(element)
      if (fullMatch !== undefined) {
        return fullMatch
      }
      const partialMatch = prefixes.find(([key]) => element.startsWith(key))
      if (partialMatch) {
        return partialMatch[1]
      }
      return undefined
    },
  }
}

export function isObject(object: any): boolean {
  return object && typeof object === "object" && !Array.isArray(object)
}

export function splitObject<T, P extends keyof T>(obj: T, ...props: P[]): [Pick<T, P>, Omit<T, P>] {
  const base: Partial<T> = {}
  const extra = { ...obj }
  for (const prop of props) {
    base[prop] = obj[prop]
    delete extra[prop]
  }
  return [base as Pick<T, P>, extra]
}

export function deepMerge(
  target: Record<keyof any, any>,
  ...sources: Record<keyof any, any>[]
): Record<keyof any, any> {
  if (!sources.length) {
    return target
  }

  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} })
        }
        deepMerge(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return deepMerge(target, ...sources)
}

export function mapKeys<K extends keyof any, N extends keyof any, V>(obj: Record<K, V>, f: (k: K) => N): Record<N, V> {
  return Object.entries(obj)
    .map(([key, val]) => [f(key as K), val])
    .reduce((res, [key, val]) => ({ ...res, [key as N]: val }), {}) as Record<N, V>
}

export function flatten(
  data: Record<keyof any, any>,
  opts?: { delimiter?: string }
): Record<string, string | boolean | number | null> {
  return Object.entries(data).reduce((res, [key, value]) => {
    if (value === undefined || value === null) {
      return { ...res, [key]: null }
    } else if (Array.isArray(value)) {
      return { ...res, [key]: JSON.stringify(value) }
    } else if (typeof value === "object") {
      const flatChild = mapKeys(flatten(value), k => `${key}${opts?.delimiter || "_"}${k}`)
      return { ...res, ...flatChild }
    } else {
      return { ...res, [key]: value }
    }
  }, {})
}

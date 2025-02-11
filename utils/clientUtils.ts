import { useRef, useEffect, EffectCallback, DependencyList } from 'react'

/*************************** REACT HELPERS ******************************/

export function usePrevious<T>(value: T, initialValue: T) {
  const ref = useRef(initialValue)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export function useEffectDebugger(
  effectHook: EffectCallback,
  dependencies: DependencyList,
  dependencyNames: string[] = [],
) {
  const previousDeps = usePrevious(dependencies, [])

  const changedDeps = dependencies.reduce(
    (
      acc: Record<string | number, { before: unknown; after: unknown }>,
      dependency,
      index,
    ) => {
      if (dependency !== previousDeps[index]) {
        const keyName = dependencyNames[index] || index
        return {
          ...acc,
          [keyName]: {
            before: previousDeps[index],
            after: dependency,
          },
        }
      }

      return acc
    },
    {},
  )

  if (Object.keys(changedDeps).length) {
    console.log('[use-effect-debugger] ', changedDeps)
  }

  useEffect(effectHook, dependencies)
}

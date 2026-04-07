export function debounce<T extends unknown[]>(
  function_: (...arguments_: T) => void,
  ms: number
): (...arguments_: T) => void {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  return (...arguments_: T) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => function_(...arguments_), ms);
  };
}

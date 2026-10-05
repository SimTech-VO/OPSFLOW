// Concatène des classes en ignorant les valeurs falsy.
export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

export const formatUtils = {
  percent:   (r: number)            => Math.round(r * 100) + '%',
  pluralize: (n: number, w: string) => n + ' ' + w + (n > 1 ? 's' : ''),
  initials:  (name: string)         => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
};

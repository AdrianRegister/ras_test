export function normalizarNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\b(slp|srl|sarl|lda|sa|sl)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

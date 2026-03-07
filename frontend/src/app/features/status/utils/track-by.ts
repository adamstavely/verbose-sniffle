/** Generic trackBy for items with an id property. Use with *ngFor or @for track. */
export function trackById<T extends { id: string }>(_index: number, item: T): string {
  return item.id;
}

export function genderButtonLabel(label: string, selected: boolean): string {
  const name = label.trim();
  return selected ? `${name}, selected` : `${name}, not selected`;
}

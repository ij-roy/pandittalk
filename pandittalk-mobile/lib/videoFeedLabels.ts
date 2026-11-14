/** Who is on the large video and who is in the small picture. */
export function videoFeedLabels(
  mainIsLocal: boolean,
  panditName: string,
): { main: string; pip: string } {
  const name = panditName.trim() || 'Pandit';
  return mainIsLocal ? { main: 'You', pip: name } : { main: name, pip: 'You' };
}

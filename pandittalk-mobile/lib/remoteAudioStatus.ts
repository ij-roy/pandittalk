/** Live audio status once the call media is up. Silence is not described as a failure. */
export function remoteAudioStatus(receiving: boolean): string {
  return receiving ? 'You can hear the pandit' : "You'll hear the pandit when they speak";
}

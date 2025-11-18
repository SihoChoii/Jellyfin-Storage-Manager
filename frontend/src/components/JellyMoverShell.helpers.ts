import type { Show } from '../types'

export const deriveShowTag = (show: Show) => {
  if (typeof show.season_count === 'number' && show.season_count > 1) return 'SERIES'
  if (typeof show.episode_count === 'number' && show.episode_count > 1) return 'EPISODES'
  const location = show.location?.trim()
  return location ? location.toUpperCase() : 'MEDIA'
}
